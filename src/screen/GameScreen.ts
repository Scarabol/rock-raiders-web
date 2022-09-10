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
import { Supervisor } from '../game/Supervisor'
import { WorldManager } from '../game/WorldManager'
import { DEV_MODE } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { LevelObjectiveTextEntry } from '../resource/wadworker/parser/ObjectiveTextParser'
import { GameLayer } from './layer/GameLayer'
import { GuiMainLayer } from './layer/GuiMainLayer'
import { OverlayLayer } from './layer/OverlayLayer'
import { SelectionLayer } from './layer/SelectionLayer'
import { ScreenMaster } from './ScreenMaster'

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

    constructor(screenMaster: ScreenMaster) {
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
        this.worldMgr.jobSupervisor = new Supervisor(this.worldMgr)
        this.worldMgr.onLevelEnd = (result) => this.onLevelEnd(new GameResult(this.levelName, this.levelConf, result, this.entityMgr, this.worldMgr))
        this.gameLayer.sceneMgr = this.sceneMgr
        this.gameLayer.entityMgr = this.entityMgr
        this.selectionLayer.sceneMgr = this.sceneMgr
        this.selectionLayer.entityMgr = this.entityMgr
        this.guiLayer.entityMgr = this.entityMgr
        this.overlayLayer.entityMgr = this.entityMgr
        this.guiMgr = new GuiManager(this.worldMgr)
        // link layer
        this.guiLayer.onOptionsShow = () => this.overlayLayer.showOptions()
        this.overlayLayer.onSetSpaceToContinue = (state: boolean) => this.guiLayer.setSpaceToContinue(state)
        this.overlayLayer.onAbortGame = () => this.onLevelEnd(new GameResult(this.levelName, this.levelConf, GameResultState.QUIT, this.entityMgr, this.worldMgr))
        this.overlayLayer.onRestartGame = () => this.restartLevel()
    }

    startLevel(levelName: string, levelConf: LevelEntryCfg) {
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
        this.worldMgr.jobSupervisor.reset()
        this.entityMgr.reset()
        this.guiLayer.reset()
        console.log(`Starting level ${this.levelName} - ${this.levelConf.fullName}`)
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
}
