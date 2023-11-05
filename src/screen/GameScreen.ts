import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { iGet } from '../core/Util'
import { EventBus } from '../event/EventBus'
import { InitRadarMap, SetupPriorityList, ShowGameResultEvent } from '../event/LocalEvents'
import { EntityManager } from '../game/EntityManager'
import { GuiManager } from '../game/GuiManager'
import { GameResult, GameResultState } from '../game/model/GameResult'
import { GameState } from '../game/model/GameState'
import { ObjectListLoader } from '../game/ObjectListLoader'
import { SceneManager } from '../game/SceneManager'
import { WorldManager } from '../game/WorldManager'
import { ADDITIONAL_RAIDER_PER_SUPPORT, DEV_MODE, MAX_RAIDER_BASE } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { LevelObjectiveTextEntry } from '../resource/fileparser/ObjectiveTextParser'
import { GameLayer } from './layer/GameLayer'
import { GuiMainLayer } from './layer/GuiMainLayer'
import { OverlayLayer } from './layer/OverlayLayer'
import { SelectionLayer } from './layer/SelectionLayer'
import { ScreenMaster } from './ScreenMaster'
import { SaveGameManager } from '../resource/SaveGameManager'
import { EventKey } from '../event/EventKeyEnum'
import { GameResultEvent, LevelSelectedEvent } from '../event/WorldEvents'
import { EntityType } from '../game/model/EntityType'

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
        this.worldMgr = new WorldManager()
        this.entityMgr = new EntityManager(this.worldMgr)
        this.sceneMgr = new SceneManager(this.gameLayer.canvas)
        this.sceneMgr.worldMgr = this.worldMgr
        this.worldMgr.sceneMgr = this.sceneMgr
        this.worldMgr.entityMgr = this.entityMgr
        this.gameLayer.worldMgr = this.worldMgr
        this.gameLayer.sceneMgr = this.sceneMgr
        this.gameLayer.entityMgr = this.entityMgr
        this.selectionLayer.worldMgr = this.worldMgr
        this.guiMgr = new GuiManager(this.worldMgr)
        EventBus.registerEventListener(EventKey.GAME_RESULT_STATE, (event: GameResultEvent) => this.startEndgameSequence(event.result))
        EventBus.registerEventListener(EventKey.RESTART_GAME, () => this.restartLevel())
        EventBus.registerEventListener(EventKey.LEVEL_SELECTED, (event: LevelSelectedEvent) => {
            this.levelName = event.levelName
            this.levelConf = event.levelConf
            this.setupAndStartLevel()
        })
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
        this.overlayLayer.setup(ResourceManager.configuration.main.missionBriefingText, objectiveText.objective, this.levelConf.objectiveImage640x480)
        EventBus.publishEvent(new SetupPriorityList(this.levelConf.priorities))
        // load in non-space objects next
        const objectList = ResourceManager.getResource(this.levelConf.oListFile)
        new ObjectListLoader(this.worldMgr, this.levelConf.disableStartTeleport || DEV_MODE).loadObjectList(objectList)
        EventBus.publishEvent(new InitRadarMap(this.sceneMgr.controls.target.clone(), this.sceneMgr.terrain))
        this.show()
    }

    show() {
        document.title = `${this.levelName} - ${this.levelConf.fullName} - Rock Raiders Web`
        this.gameLayer.show()
        this.selectionLayer.show()
        this.guiLayer.show()
        this.overlayLayer.show()
        this.sceneMgr.startScene()
        this.screenMaster.loadingLayer.hide()
    }

    hide() {
        this.entityMgr.stop()
        this.worldMgr.stop()
        this.sceneMgr.disposeScene()
        this.overlayLayer.hide()
        this.guiLayer.hide()
        this.selectionLayer.hide()
        this.gameLayer.hide()
        document.title = 'Rock Raiders Web'
    }

    async startEndgameSequence(resultState: GameResultState) {
        const gameTimeSeconds = Math.round(this.worldMgr.elapsedGameTimeMs / 1000)
        const canvas = resultState === GameResultState.COMPLETE ? await this.screenMaster.createScreenshot() : null
        this.worldMgr.requestedRaiders = 0
        this.worldMgr.requestedVehicleTypes.length = 0
        let result: GameResult = null
        if (this.levelConf.reward) {
            const numMaxAirRaiders = this.levelConf.oxygenRate ? this.entityMgr.buildings.count((b) => b.entityType === EntityType.BARRACKS) * ADDITIONAL_RAIDER_PER_SUPPORT : MAX_RAIDER_BASE
            result = new GameResult(this.levelConf.fullName, this.levelConf.reward, resultState, this.entityMgr.buildings.length, this.entityMgr.raiders.length, numMaxAirRaiders, gameTimeSeconds, canvas)
            if (result.state === GameResultState.COMPLETE) {
                SaveGameManager.setLevelScore(this.levelName, result.score)
                if (!this.levelConf.disableEndTeleport) {
                    await this.worldMgr.teleportEnd()
                }
            }
        }
        this.worldMgr.stop()
        GameState.reset()
        // TODO Show briefing panel with objective completed or objective failure or objective crystal_failure message
        this.hide()
        EventBus.publishEvent(new ShowGameResultEvent(result))
    }
}
