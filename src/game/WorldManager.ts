import { LevelConfData } from './LevelLoader'
import { clearIntervalSafe } from '../core/Util'
import { EventKey } from '../event/EventKeyEnum'
import { GameResultEvent, MaterialAmountChanged, ToggleAlarmEvent } from '../event/WorldEvents'
import { NerpRunner } from '../nerp/NerpRunner'
import { DEV_MODE, UPDATE_INTERVAL_MS } from '../params'
import { EntityManager } from './EntityManager'
import { EntityType } from './model/EntityType'
import { GameState } from './model/GameState'
import { updateSafe } from './model/Updateable'
import { SceneManager } from './SceneManager'
import { Supervisor } from './Supervisor'
import { ECS } from './ECS'
import { MovementSystem } from './system/MovementSystem'
import { SceneEntityPositionSystem } from './system/SceneEntityPositionSystem'
import { SceneEntityHeadingSystem } from './system/SceneEntityHeadingSystem'
import { RandomMoveBehaviorSystem } from './system/RandomMoveBehaviorSystem'
import { FlockBehaviorSystem } from './system/FlockBehaviorSystem'
import { DamageSystem } from './system/DamageSystem'
import { BeamUpSystem } from './system/BeamUpSystem'
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
import { EmergeSystem } from './system/EmergeSystem'
import { SoundManager } from '../audio/SoundManager'
import { TeleportSystem } from './system/TeleportSystem'
import { FallInSystem } from './system/FallInSystem'
import { FluidSurfaceSystem } from './system/FluidSurfaceSystem'
import { LaserShotSystem } from './system/LaserShotSystem'
import { GameResultState } from './model/GameResult'
import { NerpScript } from '../nerp/NerpScript'
import { PRNG } from './factory/PRNG'

export class WorldManager {
    readonly ecs: ECS = new ECS()
    readonly jobSupervisor: Supervisor = new Supervisor(this)
    sceneMgr!: SceneManager
    entityMgr!: EntityManager
    nerpRunner: NerpRunner = new NerpRunner(this, new NerpScript(), [])
    powerGrid: PowerGrid
    gameLoopInterval?: NodeJS.Timeout
    gameTimeMs: number = 0
    firstUnpause: boolean = true
    crystalsQuota: number = 0

    constructor() {
        this.powerGrid = new PowerGrid(this) // TODO Transform power grid into system with components
        this.ecs.addSystem(new MovementSystem(this))
        this.ecs.addSystem(new SceneEntityPositionSystem())
        this.ecs.addSystem(new SceneEntityHeadingSystem())
        this.ecs.addSystem(new RandomMoveBehaviorSystem())
        this.ecs.addSystem(new FlockBehaviorSystem())
        this.ecs.addSystem(new DamageSystem())
        this.ecs.addSystem(new BeamUpSystem(this))
        this.ecs.addSystem(new MapMarkerUpdateSystem())
        this.ecs.addSystem(new RockMonsterBehaviorSystem(this))
        this.ecs.addSystem(new ElectricFenceSystem(this))
        this.ecs.addSystem(new DeathSystem(this))
        if (!DEV_MODE) this.ecs.addSystem(new OxygenSystem())
        this.ecs.addSystem(new RaiderScareSystem(this))
        this.ecs.addSystem(new SlugBehaviorSystem(this))
        this.ecs.addSystem(new TerrainScannerSystem(this))
        this.ecs.addSystem(new BulletSystem(this))
        this.ecs.addSystem(new BoulderSystem(this))
        this.ecs.addSystem(new LavaErosionSystem())
        this.ecs.addSystem(new EmergeSystem(this))
        this.ecs.addSystem(new TeleportSystem(this))
        this.ecs.addSystem(new FallInSystem())
        this.ecs.addSystem(new FluidSurfaceSystem())
        this.ecs.addSystem(new LaserShotSystem(this))
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
        EventBroker.subscribe(EventKey.LOCATION_RAIDER_DISCOVERED, () => GameState.hiddenObjectsFound++)
        EventBroker.subscribe(EventKey.TOGGLE_ALARM, (event: ToggleAlarmEvent) => {
            GameState.alarmMode = event.alarmState
            if (GameState.alarmMode) SoundManager.playSfxSound('SFX_Siren')
        })
    }

    setup(levelConf: LevelConfData) {
        this.ecs.reset()
        this.gameTimeMs = 0
        this.nerpRunner = new NerpRunner(this, levelConf.nerpScript, levelConf.nerpMessages)
        this.firstUnpause = true
        const gameSpeedIndex = Math.round(SaveGameManager.preferences.gameSpeed * 5)
        GameState.gameSpeedMultiplier = [0.5, 0.75, 1, 1.5, 2, 2.5, 3][gameSpeedIndex] // XXX Publish speed change as event on network
        this.crystalsQuota = levelConf.reward?.quota?.crystals || 0
    }

    start() {
        this.nerpRunner.start()
    }

    stop() {
        this.nerpRunner.stop()
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
        const elapsedGameTimeMs = UPDATE_INTERVAL_MS * GameState.gameSpeedMultiplier
        this.gameTimeMs += elapsedGameTimeMs
        this.ecs.update(elapsedGameTimeMs)
        updateSafe(this.entityMgr, elapsedGameTimeMs)
        updateSafe(this.sceneMgr, elapsedGameTimeMs)
        updateSafe(this.jobSupervisor, elapsedGameTimeMs)
        this.checkCrystalFailure()
    }

    async teleportEnd(): Promise<void> {
        PRNG.animation.shuffle([...this.entityMgr.raiders.filter((r) => !r.vehicle), ...this.entityMgr.vehicles, ...this.entityMgr.buildings])
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

    checkCrystalFailure() {
        try {
            if (this.crystalsQuota < 1 || GameState.totalCrystals >= this.crystalsQuota) return
            EventBroker.publish(new GameResultEvent(GameResultState.CRYSTAL_FAILURE))
        } catch (e) {
            console.error(e)
        }
    }
}
