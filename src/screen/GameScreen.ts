import { BaseScreen } from './BaseScreen'
import { WorldManager } from '../scene/WorldManager'
import { SelectionLayer } from '../game/layer/SelectionLayer'
import { GameLayer } from '../game/layer/GameLayer'
import { GuiLayer } from '../game/layer/GuiLayer'
import { Supervisor } from '../game/Supervisor'
import { LevelEntryCfg, LevelsCfg } from '../cfg/LevelsCfg'
import { ResourceManager } from '../resource/ResourceManager'
import { iGet } from '../core/Util'
import { LevelObjectiveTextEntry } from '../resource/wadworker/ObjectiveTextParser'

export class GameScreen extends BaseScreen {

    onLevelEnd: () => void
    gameLayer: GameLayer
    selectionLayer: SelectionLayer
    guiLayer: GuiLayer
    worldManager: WorldManager
    jobSupervisor: Supervisor

    constructor() {
        super()
        this.gameLayer = this.addLayer(new GameLayer(), 0)
        this.selectionLayer = this.addLayer(new SelectionLayer(), 10)
        this.guiLayer = this.addLayer(new GuiLayer(), 20)
        this.worldManager = new WorldManager(this.gameLayer.canvas)
        this.gameLayer.setWorldManager(this.worldManager)
        this.selectionLayer.setWorldManager(this.worldManager)
        this.jobSupervisor = new Supervisor(this.worldManager)
    }

    startLevel(levelName) {
        const levelsCfg: LevelsCfg = ResourceManager.getResource('Levels')
        const levelConf: LevelEntryCfg = levelsCfg.levelsByName[levelName]
        if (!levelConf) throw 'Could not find level configuration for "' + levelName + '"'
        console.log('Starting level ' + levelName + ' - ' + levelConf.fullName)
        this.worldManager.setup(levelConf, this)
        const objectiveText: LevelObjectiveTextEntry = iGet(ResourceManager.getResource(levelConf.objectiveText), levelName)
        this.guiLayer.setup(objectiveText.objective, {
            filename: levelConf.objectiveImage640x480[0],
            x: levelConf.objectiveImage640x480[1],
            y: levelConf.objectiveImage640x480[2],
        })
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
