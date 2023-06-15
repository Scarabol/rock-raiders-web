import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { iGet } from '../core/Util'
import { EventBus } from '../event/EventBus'
import { SetupPriorityList, UpdateRadarTerrain } from '../event/LocalEvents'
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

export class GameScreen {
    onLevelEnd: (result: GameResult) => any = (result) => console.log(`Level ended with: ${JSON.stringify(result)}`)
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
        this.gameLayer = screenMaster.addLayer(new GameLayer(), 0)
        this.selectionLayer = screenMaster.addLayer(new SelectionLayer(), 10)
        this.guiLayer = screenMaster.addLayer(new GuiMainLayer(), 20)
        this.overlayLayer = screenMaster.addLayer(new OverlayLayer(), 30)
        this.entityMgr = new EntityManager()
        this.worldMgr = new WorldManager()
        this.sceneMgr = new SceneManager(this.gameLayer.canvas)
        this.sceneMgr.worldMgr = this.worldMgr
        this.worldMgr.sceneMgr = this.sceneMgr
        this.worldMgr.entityMgr = this.entityMgr
        this.worldMgr.onLevelEnd = (result) => this.onGameResult(result)
        this.gameLayer.worldMgr = this.worldMgr
        this.gameLayer.sceneMgr = this.sceneMgr
        this.gameLayer.entityMgr = this.entityMgr
        this.selectionLayer.worldMgr = this.worldMgr
        this.guiLayer.entityMgr = this.entityMgr
        this.overlayLayer.entityMgr = this.entityMgr
        this.guiMgr = new GuiManager(this.worldMgr)
        // link layer
        this.guiLayer.onOptionsShow = () => this.overlayLayer.showOptions()
        this.overlayLayer.onSetSpaceToContinue = (state: boolean) => this.guiLayer.setSpaceToContinue(state)
        this.overlayLayer.onAbortGame = () => this.onGameResult(GameResultState.QUIT)
        this.overlayLayer.onRestartGame = () => this.restartLevel()
    }

    startLevel(levelName: string) {
        const levelConf = ResourceManager.getLevelEntryCfg(levelName)
        this.levelName = levelName
        this.levelConf = levelConf
        this.setupAndStartLevel()
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
        this.show()
    }

    show() {
        this.gameLayer.show()
        this.selectionLayer.show()
        this.guiLayer.show()
        this.overlayLayer.show()
        this.sceneMgr.startScene()
        this.worldMgr.start()
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

    onGameResult(resultState: GameResultState) {
        const gameTimeSeconds = Math.round(this.worldMgr.elapsedGameTimeMs / 1000)
        this.screenMaster.createScreenshot().then((canvas) => {
            const result = new GameResult(this.levelConf, resultState, this.entityMgr.buildings.length, this.entityMgr.raiders.length, this.entityMgr.getMaxRaiders(), gameTimeSeconds, canvas)
            SaveGameManager.setLevelScore(this.levelName, result.score)
            this.hide()
            this.onLevelEnd(result)
        })
    }
}
