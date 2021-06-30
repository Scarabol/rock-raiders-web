import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { NerpParser } from '../core/NerpParser'
import { NerpRunner } from '../core/NerpRunner'
import { clearTimeoutSafe } from '../core/Util'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { AirLevelChanged } from '../event/LocalEvents'
import { RequestedRaidersChanged } from '../event/WorldEvents'
import { CHECK_SPAWN_RAIDER_TIMER, UPDATE_INTERVAL_MS } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { EntityManager } from './EntityManager'
import { EntityType } from './model/EntityType'
import { GameResultState } from './model/GameResult'
import { GameState } from './model/GameState'
import { Raider } from './model/raider/Raider'
import { updateSafe } from './model/Updateable'
import { SceneManager } from './SceneManager'
import { Supervisor } from './Supervisor'

export class WorldManager {

    sceneMgr: SceneManager
    entityMgr: EntityManager
    nerpRunner: NerpRunner = null
    jobSupervisor: Supervisor = null
    gameLoopTimeout = null
    oxygenRate: number = 0
    elapsedGameTimeMs: number = 0
    requestedRaiders: number = 0
    spawnRaiderTimer: number = 0
    started: boolean = false

    constructor() {
        EventBus.registerEventListener(EventKey.CAVERN_DISCOVERED, () => GameState.discoveredCaverns++)
        EventBus.registerEventListener(EventKey.PAUSE_GAME, () => this.pause())
        EventBus.registerEventListener(EventKey.UNPAUSE_GAME, () => {
            if (this.started) this.unPause()
        })
    }

    setup(levelConf: LevelEntryCfg, onLevelEnd: (state: GameResultState) => any) {
        this.started = false
        GameState.totalCaverns = levelConf.reward?.quota?.caverns || 0
        this.oxygenRate = levelConf.oxygenRate
        this.elapsedGameTimeMs = 0
        this.requestedRaiders = 0
        this.spawnRaiderTimer = 0
        // load nerp script
        this.nerpRunner = NerpParser.parse(this.entityMgr, ResourceManager.getResource(levelConf.nerpFile))
        this.nerpRunner.messages.push(...(ResourceManager.getResource(levelConf.nerpMessageFile)))
        this.nerpRunner.onLevelEnd = onLevelEnd
    }

    start() {
        this.started = true
        this.unPause()
    }

    stop() {
        this.started = false
        this.pause()
    }

    pause() {
        this.gameLoopTimeout = clearTimeoutSafe(this.gameLoopTimeout)
    }

    unPause() {
        this.gameLoopTimeout = clearTimeoutSafe(this.gameLoopTimeout)
        this.gameLoopTimeout = setTimeout(() => this.update(UPDATE_INTERVAL_MS), UPDATE_INTERVAL_MS)
    }

    update(elapsedMs: number) {
        const startUpdate = window.performance.now()
        this.elapsedGameTimeMs += UPDATE_INTERVAL_MS
        this.updateOxygen(elapsedMs)
        this.checkSpawnRaiders(elapsedMs)
        updateSafe(this.entityMgr, elapsedMs)
        updateSafe(this.sceneMgr.terrain, elapsedMs)
        updateSafe(this.jobSupervisor, elapsedMs)
        updateSafe(this.nerpRunner, elapsedMs)
        const endUpdate = window.performance.now()
        const updateDurationMs = endUpdate - startUpdate
        const sleepForMs = UPDATE_INTERVAL_MS - Math.round(updateDurationMs)
        this.gameLoopTimeout = clearTimeoutSafe(this.gameLoopTimeout)
        this.gameLoopTimeout = setTimeout(() => this.update(UPDATE_INTERVAL_MS), sleepForMs)
    }

    updateOxygen(elapsedMs: number) {
        try {
            const sum = this.entityMgr.getOxygenSum()
            const rateMultiplier = 0.001
            const valuePerSecond = 1 / 25
            const msToSeconds = 0.001
            const diff = sum * this.oxygenRate * rateMultiplier * valuePerSecond * elapsedMs * msToSeconds / 10
            const airLevel = Math.min(1, Math.max(0, GameState.airLevel + diff))
            if (GameState.airLevel !== airLevel) {
                GameState.airLevel = airLevel
                EventBus.publishEvent(new AirLevelChanged(GameState.airLevel))
            }
        } catch (e) {
            console.error(e)
        }
    }

    checkSpawnRaiders(elapsedMs: number) {
        try {
            for (this.spawnRaiderTimer += elapsedMs; this.spawnRaiderTimer >= CHECK_SPAWN_RAIDER_TIMER; this.spawnRaiderTimer -= CHECK_SPAWN_RAIDER_TIMER) {
                if (this.requestedRaiders > 0 && !this.entityMgr.hasMaxRaiders()) {
                    const teleportBuilding = this.entityMgr.findTeleportBuilding(EntityType.PILOT)
                    if (teleportBuilding) { // TODO only spawn in, when primary surface is free
                        this.requestedRaiders--
                        EventBus.publishEvent(new RequestedRaidersChanged(this.requestedRaiders))
                        const raider = new Raider(this.sceneMgr, this.entityMgr)
                        this.entityMgr.raidersInBeam.push(raider)
                        teleportBuilding.teleport.teleportIn(raider, this.entityMgr.raiders, this.entityMgr.raidersInBeam)
                    }
                }
            }
        } catch (e) {
            console.error(e)
        }
    }

}
