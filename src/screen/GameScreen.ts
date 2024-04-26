import { LevelConfData } from '../game/LevelLoader'
import { InitRadarMap, ShowGameResultEvent } from '../event/LocalEvents'
import { EntityManager } from '../game/EntityManager'
import { GuiManager } from '../game/GuiManager'
import { GameResult, GameResultState } from '../game/model/GameResult'
import { GameState } from '../game/model/GameState'
import { ObjectListLoader } from '../game/ObjectListLoader'
import { SceneManager } from '../game/SceneManager'
import { WorldManager } from '../game/WorldManager'
import { ADDITIONAL_RAIDER_PER_SUPPORT, MAX_RAIDER_BASE } from '../params'
import { GameLayer } from './layer/GameLayer'
import { GuiMainLayer } from './layer/GuiMainLayer'
import { OverlayLayer } from './layer/OverlayLayer'
import { SelectionFrameLayer } from './layer/SelectionFrameLayer'
import { ScreenMaster } from './ScreenMaster'
import { SaveGameManager } from '../resource/SaveGameManager'
import { EventKey } from '../event/EventKeyEnum'
import { GameResultEvent, LevelSelectedEvent } from '../event/WorldEvents'
import { EntityType } from '../game/model/EntityType'
import { AdvisorLayer } from './layer/AdvisorLayer'
import { EventBroker } from '../event/EventBroker'

export class GameScreen {
    readonly worldMgr: WorldManager
    readonly gameLayer: GameLayer
    readonly selectionFrameLayer: SelectionFrameLayer
    readonly advisorLayer: AdvisorLayer
    readonly guiLayer: GuiMainLayer
    readonly overlayLayer: OverlayLayer
    readonly sceneMgr: SceneManager
    readonly entityMgr: EntityManager
    readonly guiMgr: GuiManager
    levelConf: LevelConfData

    constructor(readonly screenMaster: ScreenMaster) {
        this.worldMgr = new WorldManager()
        this.gameLayer = screenMaster.addLayer(new GameLayer(this.worldMgr), 500)
        this.screenMaster.onGlobalMouseMoveEvent = this.gameLayer.onGlobalMouseMoveEvent.bind(this.gameLayer)
        this.screenMaster.onGlobalMouseLeaveEvent = this.gameLayer.onGlobalMouseLeaveEvent.bind(this.gameLayer)
        this.selectionFrameLayer = screenMaster.addLayer(new SelectionFrameLayer(), 510)
        this.advisorLayer = screenMaster.addLayer(new AdvisorLayer(), 515)
        this.guiLayer = screenMaster.addLayer(new GuiMainLayer(), 520)
        this.overlayLayer = screenMaster.addLayer(new OverlayLayer(), 530)
        this.sceneMgr = new SceneManager(this.worldMgr, this.gameLayer.canvas)
        this.entityMgr = new EntityManager(this.worldMgr)
        this.guiMgr = new GuiManager(this.worldMgr)
        EventBroker.subscribe(EventKey.GAME_RESULT_STATE, (event: GameResultEvent) => {
            this.selectionFrameLayer.active = false
            this.guiLayer.active = false
            this.overlayLayer.active = false
            this.startEndgameSequence(event.result).then()
        })
        EventBroker.subscribe(EventKey.RESTART_GAME, () => this.restartLevel())
        EventBroker.subscribe(EventKey.LEVEL_SELECTED, (event: LevelSelectedEvent) => {
            this.levelConf = event.levelConf
            this.setupAndStartLevel()
        })
    }

    dispose() {
        this.hide()
        this.screenMaster.removeLayer(this.gameLayer)
        this.screenMaster.removeLayer(this.selectionFrameLayer)
        this.screenMaster.removeLayer(this.advisorLayer)
        this.screenMaster.removeLayer(this.guiLayer)
        this.screenMaster.removeLayer(this.overlayLayer)
    }

    restartLevel() {
        this.hide()
        this.setupAndStartLevel()
    }

    private setupAndStartLevel() {
        console.log(`Starting level ${this.levelConf.levelName} - ${this.levelConf.fullName}`)
        document.title = `${this.levelConf.fullName} - Rock Raiders Web`
        const params = new URLSearchParams(window.location.search)
        params.set('entry', this.levelConf.levelName)
        history.pushState(null, '', `${window.location.pathname}?${params.toString()}`)
        GameState.reset()
        this.entityMgr.reset()
        this.guiLayer.reset()
        this.worldMgr.setup(this.levelConf)
        this.sceneMgr.setupScene(this.levelConf)
        // gather level start details for game result score calculation
        GameState.totalDiggables = this.sceneMgr.terrain.countDiggables()
        GameState.totalCrystals = this.sceneMgr.terrain.countCrystals()
        GameState.numTotalOres = this.sceneMgr.terrain.countOres()
        // setup GUI
        this.guiMgr.buildingCycleIndex = 0
        this.overlayLayer.showBriefing(this.levelConf)
        GameState.priorityList.setList(this.levelConf.priorities)
        // load in non-space objects next
        new ObjectListLoader(this.worldMgr, this.levelConf.disableStartTeleport).loadObjectList(this.levelConf.objectList)
        EventBroker.publish(new InitRadarMap(this.sceneMgr.birdViewControls.target.clone(), this.sceneMgr.terrain))
        this.show()
    }

    show() {
        this.gameLayer.show()
        this.selectionFrameLayer.show()
        this.advisorLayer.show()
        this.guiLayer.show()
        this.overlayLayer.show()
        this.sceneMgr.startScene().then(() => {
            this.screenMaster.loadingLayer.hide()
        })
    }

    hide() {
        this.entityMgr.disposeAll()
        this.worldMgr.stop()
        this.sceneMgr.disposeScene()
        this.overlayLayer.hide()
        this.guiLayer.hide()
        this.advisorLayer.hide()
        this.selectionFrameLayer.hide()
        this.gameLayer.hide()
        document.title = 'Rock Raiders Web'
    }

    async startEndgameSequence(resultState: GameResultState) {
        let result: GameResult = null
        if (this.levelConf.reward) {
            const numMaxAirRaiders = this.levelConf.oxygenRate ? this.entityMgr.buildings.count((b) => b.entityType === EntityType.BARRACKS) * ADDITIONAL_RAIDER_PER_SUPPORT : MAX_RAIDER_BASE
            const canvas = resultState === GameResultState.COMPLETE ? await this.screenMaster.createScreenshot() : null
            result = new GameResult(this.levelConf.fullName, this.levelConf.reward, resultState, this.entityMgr.buildings.length, this.entityMgr.raiders.length, numMaxAirRaiders, this.worldMgr.gameTimeSeconds, canvas)
            if (result.state === GameResultState.COMPLETE) {
                SaveGameManager.setLevelScore(this.levelConf.levelName, result.score)
            }
        }
        if (!this.levelConf.disableEndTeleport) await this.worldMgr.teleportEnd()
        this.worldMgr.stop()
        this.overlayLayer.showResultBriefing(result?.state, this.levelConf, () => {
            this.hide()
            EventBroker.publish(new ShowGameResultEvent(result))
        })
    }
}
