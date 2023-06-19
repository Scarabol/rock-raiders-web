import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { iGet } from '../core/Util'
import { EventBus } from '../event/EventBus'
import { SetupPriorityList, ShowGameResultEvent, UpdateRadarEntities, UpdateRadarTerrain } from '../event/LocalEvents'
import { EntityManager } from '../game/EntityManager'
import { GuiManager } from '../game/GuiManager'
import { GameResult, GameResultState } from '../game/model/GameResult'
import { GameState } from '../game/model/GameState'
import { ObjectListLoader } from '../game/ObjectListLoader'
import { SceneManager } from '../game/SceneManager'
import { WorldManager } from '../game/WorldManager'
import { DEV_MODE } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { LevelObjectiveTextEntry } from '../resource/wadworker/parser/ObjectiveTextParser'
import { GameLayer } from './layer/GameLayer'
import { GuiMainLayer } from './layer/GuiMainLayer'
import { OverlayLayer } from './layer/OverlayLayer'
import { SelectionLayer } from './layer/SelectionLayer'
import { ScreenMaster } from './ScreenMaster'
import { SaveGameManager } from '../resource/SaveGameManager'
import { EventKey } from '../event/EventKeyEnum'
import { GameResultEvent, LevelSelectedEvent } from '../event/WorldEvents'

export class GameScreen {
    gameLayer: GameLayer
    selectionLayer: SelectionLayer
    guiLayer: GuiMainLayer
    overlayLayer: OverlayLayer
    worldMgr: WorldManager
    sceneMgr: SceneManager
    entityMgr: EntityManager
    guiMgr: GuiManager
    levelName: string
    levelConf: LevelEntryCfg

    constructor(readonly screenMaster: ScreenMaster) {
        this.gameLayer = screenMaster.addLayer(new GameLayer(), 500)
        this.selectionLayer = screenMaster.addLayer(new SelectionLayer(), 510)
        this.guiLayer = screenMaster.addLayer(new GuiMainLayer(), 520)
        this.overlayLayer = screenMaster.addLayer(new OverlayLayer(), 530)
        this.entityMgr = new EntityManager()
        this.worldMgr = new WorldManager()
        this.sceneMgr = new SceneManager(this.gameLayer.canvas)
        this.sceneMgr.worldMgr = this.worldMgr
        this.worldMgr.sceneMgr = this.sceneMgr
        this.worldMgr.entityMgr = this.entityMgr
        this.gameLayer.worldMgr = this.worldMgr
        this.gameLayer.sceneMgr = this.sceneMgr
        this.gameLayer.entityMgr = this.entityMgr
        this.selectionLayer.worldMgr = this.worldMgr
        this.guiMgr = new GuiManager(this.worldMgr)
        EventBus.registerEventListener(EventKey.GAME_RESULT_STATE, (event: GameResultEvent) => this.takeFinalScreenshot(event.result))
        EventBus.registerEventListener(EventKey.RESTART_GAME, () => this.restartLevel())
        EventBus.registerEventListener(EventKey.LEVEL_SELECTED, (event: LevelSelectedEvent) => this.startLevel(event.levelName))
    }

    startLevel(levelName: string) {
        try {
            const levelConf = ResourceManager.getLevelEntryCfg(levelName)
            this.levelName = levelName
            this.levelConf = levelConf
            this.setupAndStartLevel()
        } catch (e) {
            console.error(`Could not load level: ${levelName}`, e)
            this.hide()
            EventBus.publishEvent(new ShowGameResultEvent())
        }
    }

    restartLevel() {
        this.hide()
        GameState.reset()
        this.setupAndStartLevel()
    }

    private setupAndStartLevel() {
        console.log(`Starting level ${this.levelName} - ${this.levelConf.fullName}`)
        this.entityMgr.reset()
        this.guiLayer.reset()
        this.worldMgr.setup(this.levelConf)
        this.sceneMgr.setupScene(this.levelConf)
        // setup GUI
        this.guiMgr.buildingCycleIndex = 0
        const objectiveText: LevelObjectiveTextEntry = iGet(ResourceManager.getResource(this.levelConf.objectiveText), this.levelName)
        this.overlayLayer.setup(objectiveText.objective, this.levelConf.objectiveImage640x480)
        EventBus.publishEvent(new SetupPriorityList(this.levelConf.priorities))
        // load in non-space objects next
        const objectList = ResourceManager.getResource(this.levelConf.oListFile)
        ObjectListLoader.loadObjectList(objectList, this.levelConf.disableStartTeleport || DEV_MODE, this.worldMgr)
        // finally generate initial radar panel map
        EventBus.publishEvent(new UpdateRadarTerrain(this.sceneMgr.terrain, this.sceneMgr.controls.target.clone()))
        EventBus.publishEvent(new UpdateRadarEntities(this.entityMgr))
        this.show()
    }

    show() {
        this.gameLayer.show()
        this.selectionLayer.show()
        this.guiLayer.show()
        this.overlayLayer.show()
        this.sceneMgr.startScene()
    }

    hide() {
        this.entityMgr.stop()
        this.worldMgr.stop()
        this.sceneMgr.disposeScene()
        this.overlayLayer.hide()
        this.guiLayer.hide()
        this.selectionLayer.hide()
        this.gameLayer.hide()
    }

    takeFinalScreenshot(resultState: GameResultState) {
        const gameTimeSeconds = Math.round(this.worldMgr.elapsedGameTimeMs / 1000)
        this.screenMaster.createScreenshot().then((canvas) => {
            let result: GameResult = null
            if (this.levelConf.reward) {
                result = new GameResult(this.levelConf.fullName, this.levelConf.reward, resultState, this.entityMgr.buildings.length, this.entityMgr.raiders.length, this.entityMgr.getMaxRaiders(), gameTimeSeconds, canvas)
                SaveGameManager.setLevelScore(this.levelName, result.score)
            } else {
                // TODO Show briefing panel with outro message for tutorial levels
                GameState.reset()
            }
            this.hide()
            EventBus.publishEvent(new ShowGameResultEvent(result))
        })
    }
}
