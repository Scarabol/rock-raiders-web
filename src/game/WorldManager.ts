import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { NerpParser } from '../core/NerpParser'
import { NerpRunner } from '../core/NerpRunner'
import { clearTimeoutSafe } from '../core/Util'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { MaterialAmountChanged, RequestedRaidersChanged, RequestedVehiclesChanged } from '../event/WorldEvents'
import { CHECK_SPAWN_RAIDER_TIMER, CHECK_SPAWN_VEHICLE_TIMER, UPDATE_INTERVAL_MS } from '../params'
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

export class WorldManager {
    onLevelEnd: (result: GameResultState) => any = (result) => console.log(`Level ended with: ${result}`)
    sceneMgr: SceneManager
    entityMgr: EntityManager
    nerpRunner: NerpRunner = null
    jobSupervisor: Supervisor = null
    gameLoopTimeout: NodeJS.Timeout = null
    oxygenRate: number = 0
    elapsedGameTimeMs: number = 0
    requestedRaiders: number = 0
    spawnRaiderTimer: number = 0
    requestedVehicleTypes: EntityType[] = []
    spawnVehicleTimer: number = 0

    constructor() {
        EventBus.registerEventListener(EventKey.CAVERN_DISCOVERED, () => GameState.discoveredCaverns++)
        EventBus.registerEventListener(EventKey.PAUSE_GAME, () => this.stopLoop())
        EventBus.registerEventListener(EventKey.UNPAUSE_GAME, () => this.startLoop(UPDATE_INTERVAL_MS))
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
    }

    setup(levelConf: LevelEntryCfg) {
        GameState.gameResult = GameResultState.UNDECIDED
        GameState.totalCaverns = levelConf.reward?.quota?.caverns || 0
        this.oxygenRate = levelConf.oxygenRate / 1000
        this.elapsedGameTimeMs = 0
        this.requestedRaiders = 0
        this.spawnRaiderTimer = 0
        this.requestedVehicleTypes = []
        this.spawnVehicleTimer = 0
        // load nerp script
        this.nerpRunner = NerpParser.parse(this.entityMgr, ResourceManager.getResource(levelConf.nerpFile))
        this.nerpRunner.messages.push(...(ResourceManager.getResource(levelConf.nerpMessageFile)))
    }

    start() {
        this.startLoop(UPDATE_INTERVAL_MS)
    }

    stop() {
        this.stopLoop()
    }

    private startLoop(timeout: number) {
        this.stopLoop() // avoid duplicate timeouts
        this.gameLoopTimeout = setTimeout(() => this.update(UPDATE_INTERVAL_MS), timeout)
    }

    private stopLoop() {
        this.gameLoopTimeout = clearTimeoutSafe(this.gameLoopTimeout)
    }

    update(elapsedMs: number) {
        const startUpdate = window.performance.now()
        this.elapsedGameTimeMs += UPDATE_INTERVAL_MS
        this.updateOxygen(elapsedMs)
        this.checkSpawnRaiders(elapsedMs)
        this.checkSpawnVehicles(elapsedMs)
        updateSafe(this.entityMgr, elapsedMs)
        updateSafe(this.sceneMgr.terrain, elapsedMs)
        updateSafe(this.jobSupervisor, elapsedMs)
        updateSafe(this.nerpRunner, elapsedMs)
        if (GameState.gameResult !== GameResultState.UNDECIDED) {
            this.onLevelEnd(GameState.gameResult)
            return
        }
        const endUpdate = window.performance.now()
        const updateDurationMs = endUpdate - startUpdate
        const sleepForMs = UPDATE_INTERVAL_MS - Math.round(updateDurationMs)
        this.startLoop(sleepForMs)
    }

    updateOxygen(elapsedMs: number) {
        try {
            const coefSum = this.entityMgr.getOxygenCoefSum()
            const valuePerMs = 1.8 / 100 / 1000
            const diff = coefSum * this.oxygenRate * valuePerMs * elapsedMs
            GameState.changeAirLevel(diff)
        } catch (e) {
            console.error(e)
        }
    }

    checkSpawnRaiders(elapsedMs: number) {
        try {
            for (this.spawnRaiderTimer += elapsedMs; this.spawnRaiderTimer >= CHECK_SPAWN_RAIDER_TIMER; this.spawnRaiderTimer -= CHECK_SPAWN_RAIDER_TIMER) {
                if (this.requestedRaiders > 0 && !this.entityMgr.hasMaxRaiders()) {
                    const teleportBuilding = this.entityMgr.findTeleportBuilding(EntityType.PILOT)
                    if (teleportBuilding) {
                        this.requestedRaiders--
                        EventBus.publishEvent(new RequestedRaidersChanged(this.requestedRaiders))
                        const raider = new Raider(this.sceneMgr, this.entityMgr)
                        teleportBuilding.teleport.teleportInRaider(raider, this.entityMgr.raiders, this.entityMgr.raidersInBeam)
                    }
                }
            }
        } catch (e) {
            console.error(e)
        }
    }

    checkSpawnVehicles(elapsedMs: number) {
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
                            const vehicle = VehicleFactory.createVehicleFromType(vType, this.sceneMgr, this.entityMgr)
                            teleportBuilding.teleport.teleportInVehicle(vehicle, this.entityMgr.vehicles, this.entityMgr.vehiclesInBeam)
                            return true
                        }
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
