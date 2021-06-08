import { LevelObjectiveTextEntry } from '../cfg/LevelObjectiveTextEntry'
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
import { ResourceManager } from '../resource/ResourceManager'
import { BaseScreen } from './BaseScreen'
import { GameLayer } from './layer/GameLayer'
import { GuiMainLayer } from './layer/GuiMainLayer'
import { OverlayLayer } from './layer/OverlayLayer'
import { SelectionLayer } from './layer/SelectionLayer'

export class GameScreen extends BaseScreen {

    onLevelEnd: (result: GameResult) => any = () => console.log('Level aborted')
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

    constructor() {
        super()
        this.gameLayer = this.addLayer(new GameLayer(this), 0)
        this.selectionLayer = this.addLayer(new SelectionLayer(), 10)
        this.guiLayer = this.addLayer(new GuiMainLayer(), 20)
        this.overlayLayer = this.addLayer(new OverlayLayer(), 30)
        this.entityMgr = new EntityManager()
        this.worldMgr = new WorldManager()
        this.sceneMgr = new SceneManager(this.gameLayer.canvas)
        this.sceneMgr.worldMgr = this.worldMgr
        this.sceneMgr.entityMgr = this.entityMgr
        this.worldMgr.sceneMgr = this.sceneMgr
        this.worldMgr.entityMgr = this.entityMgr
        this.worldMgr.jobSupervisor = new Supervisor(this.worldMgr.sceneMgr, this.worldMgr.entityMgr)
        this.cursorLayer.worldMgr = this.worldMgr
        this.cursorLayer.sceneMgr = this.sceneMgr
        this.cursorLayer.entityMgr = this.entityMgr
        this.gameLayer.worldMgr = this.worldMgr
        this.gameLayer.sceneMgr = this.sceneMgr
        this.gameLayer.entityMgr = this.entityMgr
        this.selectionLayer.worldMgr = this.worldMgr
        this.selectionLayer.sceneMgr = this.sceneMgr
        this.selectionLayer.entityMgr = this.entityMgr
        this.guiLayer.entityMgr = this.entityMgr
        this.overlayLayer.entityMgr = this.entityMgr
        this.guiMgr = new GuiManager(this.worldMgr, this.sceneMgr, this.entityMgr, this.gameLayer.canvas)
        // link layer
        this.guiLayer.onOptionsShow = () => this.overlayLayer.showOptions()
        this.overlayLayer.onSetSpaceToContinue = (state: boolean) => this.guiLayer.setSpaceToContinue(state)
        this.overlayLayer.onAbortGame = () => this.onLevelEnd(new GameResult(GameResultState.QUIT, this.entityMgr, this.worldMgr))
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
        this.entityMgr.reset()
        this.guiLayer.reset()
        console.log('Starting level ' + this.levelName + ' - ' + this.levelConf.fullName)
        this.worldMgr.setup(this.levelConf, (state) => this.onLevelEnd(new GameResult(state, this.entityMgr, this.worldMgr)))
        this.sceneMgr.setupScene(this.levelConf)
        // setup GUI
        this.guiMgr.buildingCycleIndex = 0
        const objectiveText: LevelObjectiveTextEntry = iGet(ResourceManager.getResource(this.levelConf.objectiveText), this.levelName)
        this.overlayLayer.setup(objectiveText.objective, this.levelConf.objectiveImage640x480)
        EventBus.publishEvent(new SetupPriorityList(this.levelConf.priorities))
        // load in non-space objects next
        ObjectListLoader.loadObjectList(this.levelConf, this.worldMgr, this.sceneMgr, this.entityMgr)
        // finally generate initial radar panel map
        EventBus.publishEvent(new UpdateRadarTerrain(this.sceneMgr.terrain, this.sceneMgr.controls.target.clone()))
        this.show()
    }

    show() {
        super.show()
        this.sceneMgr.startScene()
        this.worldMgr.unPause()
    }

    hide() {
        this.entityMgr.stop()
        this.worldMgr.pause()
        this.sceneMgr.disposeScene()
        super.hide()
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        this.sceneMgr?.resize(width, height)
    }

}
