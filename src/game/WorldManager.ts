import { Vector2 } from 'three'
import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { clearTimeoutSafe } from '../core/Util'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { MaterialAmountChanged, RequestedRaidersChanged, RequestedVehiclesChanged, ToggleAlarmEvent } from '../event/WorldEvents'
import { NerpRunner } from '../nerp/NerpRunner'
import { CHECK_SPAWN_RAIDER_TIMER, CHECK_SPAWN_VEHICLE_TIMER, TILESIZE, UPDATE_INTERVAL_MS } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { EntityManager } from './EntityManager'
import { EntityType } from './model/EntityType'
import { GameResultState } from './model/GameResult'
import { GameState } from './model/GameState'
import { Raider } from './model/raider/Raider'
import { updateSafe } from './model/Updateable'
import { VehicleFactory } from './model/vehicle/VehicleFactory'
import { SceneManager } from './SceneManager'
import { Supervisor } from './Supervisor'
import { ECS } from './ECS'
import { MovementSystem } from './system/MovementSystem'
import { SceneEntityPositionSystem } from './system/SceneEntityPositionSystem'
import { SceneEntityHeadingSystem } from './system/SceneEntityHeadingSystem'
import { RandomMoveBehaviorSystem } from './system/RandomMoveBehaviorSystem'
import { DamageSystem } from './system/DamageSystem'
import { BeamUpSystem } from './system/BeamUpSystem'
import { ShowMissionBriefingEvent } from '../event/LocalEvents'

export class WorldManager {
    onLevelEnd: (result: GameResultState) => any = (result) => console.log(`Level ended with: ${result}`)
    readonly ecs: ECS = new ECS()
    readonly jobSupervisor: Supervisor = new Supervisor(this)
    sceneMgr: SceneManager
    entityMgr: EntityManager
    nerpRunner: NerpRunner = null
    gameLoopTimeout: NodeJS.Timeout = null
    oxygenRate: number = 0
    elapsedGameTimeMs: number = 0
    requestedRaiders: number = 0
    spawnRaiderTimer: number = 0
    requestedVehicleTypes: EntityType[] = []
    spawnVehicleTimer: number = 0
    started: boolean = false
    firstUnpause: boolean = true

    constructor() {
        this.ecs.worldMgr = this
        this.ecs.addSystem(new MovementSystem())
        this.ecs.addSystem(new SceneEntityPositionSystem())
        this.ecs.addSystem(new SceneEntityHeadingSystem())
        this.ecs.addSystem(new RandomMoveBehaviorSystem())
        this.ecs.addSystem(new DamageSystem())
        this.ecs.addSystem(new BeamUpSystem())
        EventBus.registerEventListener(EventKey.CAVERN_DISCOVERED, () => GameState.discoveredCaverns++)
        EventBus.registerEventListener(EventKey.PAUSE_GAME, () => this.stopLoop())
        EventBus.registerEventListener(EventKey.UNPAUSE_GAME, () => {
            if (this.started) this.startLoop(UPDATE_INTERVAL_MS)
            if (this.firstUnpause) {
                this.firstUnpause = false
                this.sceneMgr.terrain.forEachSurface((s) => {
                    if (s.isUnstable()) s.collapse() // crumble unsupported walls
                })
            }
        })
        EventBus.registerEventListener(EventKey.REQUESTED_VEHICLES_CHANGED, (event: RequestedVehiclesChanged) => {
            const requestedChange = event.numRequested - this.requestedVehicleTypes.count((e) => e === event.vehicle)
            for (let c = 0; c < -requestedChange; c++) {
                this.requestedVehicleTypes.removeLast(event.vehicle)
            }
            for (let c = 0; c < requestedChange; c++) {
                this.requestedVehicleTypes.push(event.vehicle)
            }
        })
        EventBus.registerEventListener(EventKey.LOCATION_RAIDER_DISCOVERED, () => GameState.hiddenObjectsFound++)
        EventBus.registerEventListener(EventKey.TOGGLE_ALARM, (event: ToggleAlarmEvent) => GameState.alarmMode = event.alarmState)
        EventBus.registerEventListener(EventKey.SHOW_MISSION_BRIEFING, (event: ShowMissionBriefingEvent) => {
            if (!this.nerpRunner) return
            this.nerpRunner.objectiveShowing += event.isShowing ? 1 : 0
            this.nerpRunner.objectiveSwitch = this.nerpRunner.objectiveSwitch && event.isShowing
        })
    }

    setup(levelConf: LevelEntryCfg) {
        this.entityMgr.ecs = this.ecs
        this.ecs.reset()
        this.jobSupervisor.reset()
        GameState.gameResult = GameResultState.UNDECIDED
        GameState.changeNeededCrystals(levelConf.reward?.quota?.crystals || 0)
        GameState.totalCaverns = levelConf.reward?.quota?.caverns || 0
        this.oxygenRate = levelConf.oxygenRate / 1000
        this.elapsedGameTimeMs = 0
        this.requestedRaiders = 0
        this.spawnRaiderTimer = 0
        this.requestedVehicleTypes = []
        this.spawnVehicleTimer = 0
        // load nerp script
        this.nerpRunner = new NerpRunner(this, levelConf.nerpFile)
        this.nerpRunner.messages.push(...(ResourceManager.getResource(levelConf.nerpMessageFile)))
        this.firstUnpause = true
    }

    start() {
        this.startLoop(UPDATE_INTERVAL_MS)
        this.started = true
    }

    stop() {
        this.started = false
        this.stopLoop()
    }

    private startLoop(timeout: number) {
        this.stopLoop() // avoid duplicate timeouts
        this.gameLoopTimeout = setTimeout(() => this.mainLoop(UPDATE_INTERVAL_MS), timeout)
    }

    private stopLoop() {
        this.gameLoopTimeout = clearTimeoutSafe(this.gameLoopTimeout)
    }

    private mainLoop(elapsedMs: number) {
        const startUpdate = window.performance.now()
        this.elapsedGameTimeMs += UPDATE_INTERVAL_MS
        this.update(elapsedMs)
        if (GameState.gameResult !== GameResultState.UNDECIDED) {
            this.onLevelEnd(GameState.gameResult)
            return
        }
        const endUpdate = window.performance.now()
        const updateDurationMs = endUpdate - startUpdate
        const sleepForMs = UPDATE_INTERVAL_MS - Math.round(updateDurationMs)
        this.startLoop(sleepForMs)
    }

    private update(elapsedMs: number) {
        this.updateOxygen(elapsedMs)
        this.checkSpawnRaiders(elapsedMs)
        this.checkSpawnVehicles(elapsedMs)
        this.ecs.update(elapsedMs)
        updateSafe(this.entityMgr, elapsedMs)
        updateSafe(this.sceneMgr, elapsedMs)
        updateSafe(this.jobSupervisor, elapsedMs)
        updateSafe(this.nerpRunner, elapsedMs)
    }

    private updateOxygen(elapsedMs: number) {
        try {
            const coefSum = this.entityMgr.getOxygenCoefSum()
            const valuePerMs = 1.8 / 100 / 1000
            const diff = coefSum * this.oxygenRate * valuePerMs * elapsedMs
            GameState.changeAirLevel(diff)
        } catch (e) {
            console.error(e)
        }
    }

    private checkSpawnRaiders(elapsedMs: number) {
        try {
            for (this.spawnRaiderTimer += elapsedMs; this.spawnRaiderTimer >= CHECK_SPAWN_RAIDER_TIMER; this.spawnRaiderTimer -= CHECK_SPAWN_RAIDER_TIMER) {
                if (this.requestedRaiders > 0 && !this.entityMgr.hasMaxRaiders()) {
                    const teleportBuilding = this.entityMgr.findTeleportBuilding(EntityType.PILOT)
                    if (teleportBuilding) {
                        this.requestedRaiders--
                        EventBus.publishEvent(new RequestedRaidersChanged(this.requestedRaiders))
                        const raider = new Raider(this)
                        const heading = teleportBuilding.sceneEntity.getHeading()
                        const worldPosition = new Vector2(0, TILESIZE / 2).rotateAround(new Vector2(0, 0), -heading).add(teleportBuilding.sceneEntity.position2D)
                        const walkOutPos = teleportBuilding.primaryPathSurface.getRandomPosition()
                        teleportBuilding.teleport.teleportIn(raider, this.entityMgr.raiders, this.entityMgr.raidersInBeam, worldPosition, heading, walkOutPos)
                    }
                }
            }
        } catch (e) {
            console.error(e)
        }
    }

    private checkSpawnVehicles(elapsedMs: number) {
        try {
            for (this.spawnVehicleTimer += elapsedMs; this.spawnVehicleTimer >= CHECK_SPAWN_VEHICLE_TIMER; this.spawnVehicleTimer -= CHECK_SPAWN_VEHICLE_TIMER) {
                if (this.requestedVehicleTypes.length > 0) {
                    const spawnedVehicleType = this.requestedVehicleTypes.find((vType) => {
                        const stats = VehicleFactory.getVehicleStatsByType(vType)
                        if (GameState.numCrystal < stats.CostCrystal) return false
                        const teleportBuilding = this.entityMgr.findTeleportBuilding(vType)
                        if (teleportBuilding) {
                            GameState.numCrystal -= stats.CostCrystal
                            EventBus.publishEvent(new MaterialAmountChanged())
                            const vehicle = VehicleFactory.createVehicleFromType(vType, this)
                            const worldPosition = teleportBuilding.primaryPathSurface.getCenterWorld2D()
                            const heading = teleportBuilding.sceneEntity.getHeading()
                            teleportBuilding.teleport.teleportIn(vehicle, this.entityMgr.vehicles, this.entityMgr.vehiclesInBeam, worldPosition, heading, null)
                            return true
                        }
                        return false
                    })
                    if (spawnedVehicleType) {
                        this.requestedVehicleTypes.remove(spawnedVehicleType)
                        EventBus.publishEvent(new RequestedVehiclesChanged(spawnedVehicleType, this.requestedVehicleTypes.count((e) => e === spawnedVehicleType)))
                    }
                }
            }
        } catch (e) {
            console.error(e)
        }
    }
}
