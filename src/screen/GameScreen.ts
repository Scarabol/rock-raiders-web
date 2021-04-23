import { BaseScreen } from './BaseScreen'
import { WorldManager } from '../scene/WorldManager'
import { SelectionLayer } from '../game/layer/SelectionLayer'
import { GameLayer } from '../game/layer/GameLayer'
import { GuiMainLayer } from '../game/layer/GuiMainLayer'
import { Supervisor } from '../game/Supervisor'
import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { ResourceManager } from '../resource/ResourceManager'
import { iGet } from '../core/Util'
import { LevelObjectiveTextEntry } from '../resource/wadworker/ObjectiveTextParser'
import { OverlayLayer } from '../game/layer/OverlayLayer'
import { GameState } from '../game/model/GameState'

export class GameScreen extends BaseScreen {

    onLevelEnd: () => void
    gameLayer: GameLayer
    selectionLayer: SelectionLayer
    guiLayer: GuiMainLayer
    overlayLayer: OverlayLayer
    worldManager: WorldManager
    jobSupervisor: Supervisor
    levelName: string
    levelConf: LevelEntryCfg

    constructor() {
        super()
        this.gameLayer = this.addLayer(new GameLayer(), 0)
        this.selectionLayer = this.addLayer(new SelectionLayer(), 10)
        this.guiLayer = this.addLayer(new GuiMainLayer(), 20)
        this.overlayLayer = this.addLayer(new OverlayLayer(), 30)
        this.worldManager = new WorldManager(this.gameLayer.canvas)
        this.gameLayer.setWorldManager(this.worldManager)
        this.selectionLayer.setWorldManager(this.worldManager)
        this.jobSupervisor = new Supervisor(this.worldManager)
        // link layer
        this.guiLayer.onOptionsShow = () => this.overlayLayer.panelOptions.show()
        this.overlayLayer.panelBriefing.messagePanel = this.guiLayer.panelMessages
        this.overlayLayer.panelPause.onAbortGame = () => this.onLevelEnd && this.onLevelEnd()
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
        this.worldManager.setup(this.levelConf, this)
        const objectiveText: LevelObjectiveTextEntry = iGet(ResourceManager.getResource(this.levelConf.objectiveText), this.levelName)
        this.guiLayer.reset()
        this.overlayLayer.setup(objectiveText.objective, this.levelConf.objectiveImage640x480)
        this.show()
    }

    show() {
        super.show()
        this.worldManager.start()
        this.jobSupervisor.start()
    }

    hide() {
        this.worldManager.stop()
        this.jobSupervisor.stop()
        super.hide()
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        if (this.worldManager) this.worldManager.resize(width, height)
    }

}
