import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { iGet } from '../core/Util'
import { GameState } from '../game/model/GameState'
import { Supervisor } from '../game/Supervisor'
import { WorldManager } from '../game/WorldManager'
import { ResourceManager } from '../resource/ResourceManager'
import { LevelObjectiveTextEntry } from '../resource/wadworker/ObjectiveTextParser'
import { BaseScreen } from './BaseScreen'
import { GameLayer } from './layer/GameLayer'
import { GuiMainLayer } from './layer/GuiMainLayer'
import { OverlayLayer } from './layer/OverlayLayer'
import { SelectionLayer } from './layer/SelectionLayer'

export class GameScreen extends BaseScreen {

    onLevelEnd: () => void = () => console.log('Level aborted')
    gameLayer: GameLayer
    selectionLayer: SelectionLayer
    guiLayer: GuiMainLayer
    overlayLayer: OverlayLayer
    worldMgr: WorldManager
    jobSupervisor: Supervisor
    levelName: string
    levelConf: LevelEntryCfg

    constructor() {
        super()
        this.gameLayer = this.addLayer(new GameLayer(), 0)
        this.selectionLayer = this.addLayer(new SelectionLayer(), 10)
        this.guiLayer = this.addLayer(new GuiMainLayer(), 20)
        this.overlayLayer = this.addLayer(new OverlayLayer(), 30)
        this.worldMgr = new WorldManager(this.gameLayer.canvas)
        this.gameLayer.worldMgr = this.worldMgr
        this.gameLayer.sceneMgr = this.worldMgr.sceneManager
        this.selectionLayer.sceneMgr = this.worldMgr.sceneManager
        this.jobSupervisor = new Supervisor(this.worldMgr)
        // link layer
        this.guiLayer.onOptionsShow = () => this.overlayLayer.panelOptions.show()
        this.overlayLayer.panelBriefing.messagePanel = this.guiLayer.panelMessages
        this.overlayLayer.panelPause.onAbortGame = () => this.onLevelEnd()
        this.overlayLayer.panelPause.onRestartGame = () => this.restartLevel()
    }

    startLevel(levelName) {
        this.levelName = levelName
        this.levelConf = ResourceManager.getResource('Levels').levelsByName[this.levelName]
        if (!this.levelConf) throw 'Could not find level configuration for "' + this.levelName + '"'
        this.setupAndStartLevel()
    }

    restartLevel() {
        this.hide()
        GameState.reset()
        this.setupAndStartLevel()
    }

    private setupAndStartLevel() {
        console.log('Starting level ' + this.levelName + ' - ' + this.levelConf.fullName)
        this.worldMgr.setup(this.levelConf, this)
        const objectiveText: LevelObjectiveTextEntry = iGet(ResourceManager.getResource(this.levelConf.objectiveText), this.levelName)
        this.guiLayer.reset()
        this.overlayLayer.setup(objectiveText.objective, this.levelConf.objectiveImage640x480)
        this.show()
    }

    show() {
        super.show()
        this.worldMgr.start()
        this.jobSupervisor.start()
    }

    hide() {
        this.worldMgr.stop()
        this.jobSupervisor.stop()
        super.hide()
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        this.worldMgr?.resize(width, height)
    }

}
