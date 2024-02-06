import { Vector2 } from 'three'
import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { clearIntervalSafe } from '../core/Util'
import { EventKey } from '../event/EventKeyEnum'
import { MaterialAmountChanged, RequestedRaidersChanged, RequestedVehiclesChanged, ToggleAlarmEvent } from '../event/WorldEvents'
import { NerpRunner } from '../nerp/NerpRunner'
import { CHECK_SPAWN_RAIDER_TIMER, CHECK_SPAWN_VEHICLE_TIMER, DEV_MODE, TILESIZE, UPDATE_INTERVAL_MS } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { EntityManager } from './EntityManager'
import { EntityType } from './model/EntityType'
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
import { OxygenSystem } from './system/OxygenSystem'
import { MapMarkerUpdateSystem } from './system/MapMarkerUpdateSystem'
import { RockMonsterBehaviorSystem } from './system/RockMonsterBehaviorSystem'
import { ElectricFenceSystem } from './system/ElectricFenceSystem'
import { DeathSystem } from './system/DeathSystem'
import { RaiderScareSystem } from './system/RaiderScareSystem'
import { SlugBehaviorSystem } from './system/SlugBehaviorSystem'
import { TerrainScannerSystem } from './system/TerrainScannerSystem'
import { BulletSystem } from './system/BulletSystem'
import { BoulderSystem } from './system/BoulderSystem'
import { MaterialEntity } from './model/material/MaterialEntity'
import { LavaErosionSystem } from './system/LavaErosionSystem'
import { SaveGameManager } from '../resource/SaveGameManager'
import { EventBroker } from '../event/EventBroker'
import { PowerGrid } from './terrain/PowerGrid'

export class WorldManager {
    readonly ecs: ECS = new ECS()
    readonly jobSupervisor: Supervisor = new Supervisor(this)
    readonly damageSystem: DamageSystem
    sceneMgr: SceneManager
    entityMgr: EntityManager
    nerpRunner: NerpRunner = null
    powerGrid: PowerGrid
    gameLoopInterval: NodeJS.Timeout = null
    elapsedGameTimeMs: number = 0
    requestedRaiders: number = 0
    spawnRaiderTimer: number = 0
    requestedVehicleTypes: EntityType[] = []
    spawnVehicleTimer: number = 0
    firstUnpause: boolean = true
    gameSpeedMultiplier: number = 1

    constructor() {
        this.ecs.worldMgr = this
        this.powerGrid = new PowerGrid(this) // TODO Transform into system with components
        this.ecs.addSystem(new MovementSystem())
        this.ecs.addSystem(new SceneEntityPositionSystem())
        this.ecs.addSystem(new SceneEntityHeadingSystem())
        this.ecs.addSystem(new RandomMoveBehaviorSystem())
        this.damageSystem = this.ecs.addSystem(new DamageSystem())
        this.ecs.addSystem(new BeamUpSystem())
        this.ecs.addSystem(new MapMarkerUpdateSystem())
        this.ecs.addSystem(new RockMonsterBehaviorSystem(this))
        this.ecs.addSystem(new ElectricFenceSystem(this))
        this.ecs.addSystem(new DeathSystem(this))
        if (!DEV_MODE) this.ecs.addSystem(new OxygenSystem())
        this.ecs.addSystem(new RaiderScareSystem(this))
        this.ecs.addSystem(new SlugBehaviorSystem(this))
        this.ecs.addSystem(new TerrainScannerSystem(this))
        this.ecs.addSystem(new BulletSystem(this))
        this.ecs.addSystem(new BoulderSystem())
        this.ecs.addSystem(new LavaErosionSystem())
        EventBroker.subscribe(EventKey.CAVERN_DISCOVERED, () => GameState.discoveredCaverns++)
        EventBroker.subscribe(EventKey.PAUSE_GAME, () => this.stopLoop())
        EventBroker.subscribe(EventKey.UNPAUSE_GAME, () => {
            this.startLoop()
            if (this.firstUnpause) {
                this.firstUnpause = false
                this.sceneMgr.terrain.forEachSurface((s) => {
                    if (s.isUnstable()) s.collapse() // crumble unsupported walls
                })
            }
        })
        EventBroker.subscribe(EventKey.REQUESTED_VEHICLES_CHANGED, (event: RequestedVehiclesChanged) => {
            const requestedChange = event.numRequested - this.requestedVehicleTypes.count((e) => e === event.vehicle)
            for (let c = 0; c < -requestedChange; c++) {
                this.requestedVehicleTypes.removeLast(event.vehicle)
            }
            for (let c = 0; c < requestedChange; c++) {
                this.requestedVehicleTypes.push(event.vehicle)
            }
        })
        EventBroker.subscribe(EventKey.LOCATION_RAIDER_DISCOVERED, () => GameState.hiddenObjectsFound++)
        EventBroker.subscribe(EventKey.TOGGLE_ALARM, (event: ToggleAlarmEvent) => GameState.alarmMode = event.alarmState)
        EventBroker.subscribe(EventKey.SHOW_MISSION_BRIEFING, (event: ShowMissionBriefingEvent) => {
            if (!this.nerpRunner) return
            this.nerpRunner.objectiveShowing = event.isShowing ? 1 : 0
            this.nerpRunner.objectiveSwitch = this.nerpRunner.objectiveSwitch && event.isShowing
        })
        EventBroker.subscribe(EventKey.NERP_MESSAGE_NEXT, () => {
            this.nerpRunner.messageTimer = 0
            this.nerpRunner.execute()
        })
    }

    setup(levelConf: LevelEntryCfg) {
        this.ecs.reset()
        this.jobSupervisor.reset()
        this.elapsedGameTimeMs = 0
        this.requestedRaiders = 0
        this.spawnRaiderTimer = 0
        this.requestedVehicleTypes = []
        this.spawnVehicleTimer = 0
        // load nerp script
        this.nerpRunner = new NerpRunner(this, levelConf.nerpFile)
        this.nerpRunner.messages.push(...(ResourceManager.getResource(levelConf.nerpMessageFile)))
        this.firstUnpause = true
        const gameSpeedIndex = Math.round(SaveGameManager.currentPreferences.gameSpeed * 5)
        this.gameSpeedMultiplier = [0.5, 0.75, 1, 1.5, 2, 2.5, 3][gameSpeedIndex] // XXX Publish speed change as event on network
    }

    stop() {
        this.stopLoop()
    }

    private startLoop() {
        this.stopLoop() // avoid duplicate intervals
        this.gameLoopInterval = setInterval(this.mainLoop.bind(this), UPDATE_INTERVAL_MS)
    }

    private stopLoop() {
        this.gameLoopInterval = clearIntervalSafe(this.gameLoopInterval)
    }

    private mainLoop() {
        this.update(UPDATE_INTERVAL_MS * this.gameSpeedMultiplier)
    }

    private update(elapsedMs: number) {
        this.elapsedGameTimeMs += elapsedMs
        this.checkSpawnRaiders(elapsedMs)
        this.checkSpawnVehicles(elapsedMs)
        this.ecs.update(elapsedMs)
        updateSafe(this.entityMgr, elapsedMs)
        updateSafe(this.sceneMgr, elapsedMs)
        updateSafe(this.jobSupervisor, elapsedMs)
        updateSafe(this.nerpRunner, elapsedMs)
    }

    private checkSpawnRaiders(elapsedMs: number) {
        try {
            for (this.spawnRaiderTimer += elapsedMs; this.spawnRaiderTimer >= CHECK_SPAWN_RAIDER_TIMER; this.spawnRaiderTimer -= CHECK_SPAWN_RAIDER_TIMER) {
                if (this.requestedRaiders > 0 && !this.entityMgr.hasMaxRaiders()) {
                    const teleportBuilding = this.entityMgr.findTeleportBuilding(EntityType.PILOT)
                    if (teleportBuilding) {
                        this.requestedRaiders--
                        EventBroker.publish(new RequestedRaidersChanged(this.requestedRaiders))
                        const raider = new Raider(this)
                        const heading = teleportBuilding.sceneEntity.heading
                        const worldPosition = new Vector2(0, TILESIZE / 2).rotateAround(new Vector2(0, 0), -heading).add(teleportBuilding.getPosition2D())
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
                        if (!teleportBuilding) return false
                        GameState.numCrystal -= stats.CostCrystal
                        EventBroker.publish(new MaterialAmountChanged())
                        const vehicle = VehicleFactory.createVehicleFromType(vType, this)
                        const worldPosition = (teleportBuilding.waterPathSurface ?? teleportBuilding.primaryPathSurface).getCenterWorld2D()
                        const heading = teleportBuilding.sceneEntity.heading
                        teleportBuilding.teleport.teleportIn(vehicle, this.entityMgr.vehicles, this.entityMgr.vehiclesInBeam, worldPosition, heading, null)
                        return true
                    })
                    if (spawnedVehicleType) {
                        this.requestedVehicleTypes.remove(spawnedVehicleType)
                        EventBroker.publish(new RequestedVehiclesChanged(spawnedVehicleType, this.requestedVehicleTypes.count((e) => e === spawnedVehicleType)))
                    }
                }
            }
        } catch (e) {
            console.error(e)
        }
    }

    async teleportEnd(): Promise<void> {
        ;[...this.entityMgr.raiders.filter((r) => !r.vehicle), ...this.entityMgr.vehicles, ...this.entityMgr.buildings].shuffle()
            .forEach((e, i) => setTimeout(() => e.beamUp(), i * 200))
        return new Promise((resolve) => setTimeout(() => resolve(), 10000))
    }

    depositItem(item: MaterialEntity) {
        if (item.entityType === EntityType.ORE || item.entityType === EntityType.CRYSTAL || item.entityType === EntityType.BRICK) {
            if (item.entityType === EntityType.ORE) GameState.numOre++
            else if (item.entityType === EntityType.CRYSTAL) GameState.numCrystal++
            else if (item.entityType === EntityType.BRICK) GameState.numBrick++
            EventBroker.publish(new MaterialAmountChanged())
        }
    }
}
