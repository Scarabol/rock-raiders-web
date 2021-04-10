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

export class GameScreen extends BaseScreen {

    onLevelEnd: () => void
    gameLayer: GameLayer
    selectionLayer: SelectionLayer
    guiLayer: GuiMainLayer
    overlayLayer: OverlayLayer
    worldManager: WorldManager
    jobSupervisor: Supervisor

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
    }

    startLevel(levelName) {
        const levelConf: LevelEntryCfg = ResourceManager.getResource('Levels').levelsByName[levelName]
        if (!levelConf) throw 'Could not find level configuration for "' + levelName + '"'
        console.log('Starting level ' + levelName + ' - ' + levelConf.fullName)
        this.worldManager.setup(levelConf, this)
        const objectiveText: LevelObjectiveTextEntry = iGet(ResourceManager.getResource(levelConf.objectiveText), levelName)
        this.guiLayer.reset()
        this.overlayLayer.setup(objectiveText.objective, levelConf.objectiveImage640x480)
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
