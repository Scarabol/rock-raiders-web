import { LevelConfData } from './LevelLoader'
import { clearIntervalSafe } from '../core/Util'
import { EventKey } from '../event/EventKeyEnum'
import { MaterialAmountChanged, ToggleAlarmEvent } from '../event/WorldEvents'
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
import { EmergeSystem } from './system/EmergeSystem'
import { SoundManager } from '../audio/SoundManager'
import { Sample } from '../audio/Sample'
import { TeleportSystem } from './system/TeleportSystem'
import { FallInSystem } from './system/FallInSystem'
import { FluidSurfaceSystem } from './system/FluidSurfaceSystem'

export class WorldManager {
    readonly ecs: ECS = new ECS()
    readonly jobSupervisor: Supervisor = new Supervisor(this)
    sceneMgr: SceneManager
    entityMgr: EntityManager
    nerpRunner: NerpRunner = null
    powerGrid: PowerGrid
    gameLoopInterval: NodeJS.Timeout = null
    gameTimeMs: number = 0
    firstUnpause: boolean = true
    gameSpeedMultiplier: number = 1

    constructor() {
        this.ecs.worldMgr = this
        this.powerGrid = new PowerGrid(this) // TODO Transform into system with components
        this.ecs.addSystem(new MovementSystem())
        this.ecs.addSystem(new SceneEntityPositionSystem())
        this.ecs.addSystem(new SceneEntityHeadingSystem())
        this.ecs.addSystem(new RandomMoveBehaviorSystem())
        this.ecs.addSystem(new DamageSystem())
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
        this.ecs.addSystem(new EmergeSystem())
        this.ecs.addSystem(new TeleportSystem())
        this.ecs.addSystem(new FallInSystem())
        this.ecs.addSystem(new FluidSurfaceSystem())
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
            if (GameState.alarmMode) SoundManager.playSample(Sample.SFX_Siren, false)
        })
        EventBroker.subscribe(EventKey.SHOW_MISSION_BRIEFING, (event: ShowMissionBriefingEvent) => {
            if (!this.nerpRunner) return
            this.nerpRunner.objectiveShowing = event.isShowing ? 1 : 0
            this.nerpRunner.objectiveSwitch = this.nerpRunner.objectiveSwitch && event.isShowing
        })
    }

    setup(levelConf: LevelConfData) {
        this.ecs.reset()
        this.jobSupervisor.reset()
        this.gameTimeMs = 0
        // load nerp script
        if (levelConf.nerpScript) this.nerpRunner = new NerpRunner(this, levelConf.nerpScript, levelConf.nerpMessages)
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
        const elapsedGameTimeMs = UPDATE_INTERVAL_MS * this.gameSpeedMultiplier
        this.gameTimeMs += elapsedGameTimeMs
        this.ecs.update(elapsedGameTimeMs)
        updateSafe(this.entityMgr, elapsedGameTimeMs)
        updateSafe(this.sceneMgr, elapsedGameTimeMs)
        updateSafe(this.jobSupervisor, elapsedGameTimeMs)
        updateSafe(this.nerpRunner, UPDATE_INTERVAL_MS)
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

    get gameTimeSeconds(): number {
        return Math.round(this.gameTimeMs / 1000)
    }
}
