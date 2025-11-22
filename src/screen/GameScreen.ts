import { LevelConfData } from '../game/LevelLoader'
import { DeselectAll, InitRadarMap, ShowGameResultEvent } from '../event/LocalEvents'
import { EntityManager } from '../game/EntityManager'
import { GuiManager } from '../game/GuiManager'
import { GAME_RESULT_STATE, GameResult, GameResultState } from '../game/model/GameResult'
import { GameState } from '../game/model/GameState'
import { ObjectListLoader } from '../game/ObjectListLoader'
import { SceneManager } from '../game/SceneManager'
import { WorldManager } from '../game/WorldManager'
import { ADDITIONAL_RAIDER_PER_SUPPORT, DEV_MODE, MAX_RAIDER_BASE } from '../params'
import { GameLayer } from './layer/GameLayer'
import { GuiBottomLeftLayer, GuiBottomRightLayer, GuiTopLeftLayer, GuiTopRightLayer } from './layer/GuiMainLayer'
import { OverlayLayer } from './layer/OverlayLayer'
import { SelectionFrameLayer } from './layer/SelectionFrameLayer'
import { ScreenMaster } from './ScreenMaster'
import { SaveGameManager } from '../resource/SaveGameManager'
import { EventKey } from '../event/EventKeyEnum'
import { GameResultEvent, LevelSelectedEvent, MaterialAmountChanged } from '../event/WorldEvents'
import { EntityType } from '../game/model/EntityType'
import { AdvisorLayer } from './layer/AdvisorLayer'
import { EventBroker } from '../event/EventBroker'
import { NamingLayer } from './layer/NamingLayer'
import { PRNG } from '../game/factory/PRNG'
import { EncodingHelper } from '../resource/fileparser/EncodingHelper'

export class GameScreen {
    readonly worldMgr: WorldManager
    readonly gameLayer: GameLayer
    readonly selectionFrameLayer: SelectionFrameLayer
    readonly advisorLayer: AdvisorLayer
    readonly namingLayer: NamingLayer
    readonly guiTopLeftLayer: GuiTopLeftLayer
    readonly guiTopRightLayer: GuiTopRightLayer
    readonly guiBottomRightLayer: GuiBottomRightLayer
    readonly guiBottomLeftLayer: GuiBottomLeftLayer
    readonly overlayLayer: OverlayLayer
    readonly sceneMgr: SceneManager
    readonly entityMgr: EntityManager
    readonly guiMgr: GuiManager
    levelConf: LevelConfData | undefined

    constructor(readonly screenMaster: ScreenMaster) {
        this.worldMgr = new WorldManager()
        this.gameLayer = screenMaster.addLayer(new GameLayer(this.worldMgr), 500)
        this.screenMaster.onGlobalMouseMoveEvent = this.gameLayer.onGlobalMouseMoveEvent.bind(this.gameLayer)
        this.screenMaster.onGlobalMouseLeaveEvent = this.gameLayer.onGlobalMouseLeaveEvent.bind(this.gameLayer)
        this.selectionFrameLayer = screenMaster.addLayer(new SelectionFrameLayer(this.worldMgr), 510)
        this.advisorLayer = screenMaster.addLayer(new AdvisorLayer(), 515)
        this.namingLayer = screenMaster.addLayer(new NamingLayer(this), 518)
        this.guiTopLeftLayer = screenMaster.addLayer(new GuiTopLeftLayer(), 520)
        this.guiTopRightLayer = screenMaster.addLayer(new GuiTopRightLayer(), 521)
        this.guiBottomRightLayer = screenMaster.addLayer(new GuiBottomRightLayer(), 522)
        this.guiBottomLeftLayer = screenMaster.addLayer(new GuiBottomLeftLayer(), 523)
        this.overlayLayer = screenMaster.addLayer(new OverlayLayer(), 530)
        this.sceneMgr = new SceneManager(this.worldMgr, this.gameLayer.canvas)
        this.entityMgr = new EntityManager(this.worldMgr)
        this.guiMgr = new GuiManager(this.worldMgr)
        EventBroker.subscribe(EventKey.GAME_RESULT_STATE, (event: GameResultEvent) => {
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
        this.screenMaster.removeLayer(this.namingLayer)
        this.screenMaster.removeLayer(this.guiTopLeftLayer)
        this.screenMaster.removeLayer(this.guiTopRightLayer)
        this.screenMaster.removeLayer(this.guiBottomRightLayer)
        this.screenMaster.removeLayer(this.guiBottomLeftLayer)
        this.screenMaster.removeLayer(this.overlayLayer)
    }

    restartLevel() {
        if (!this.levelConf) throw new Error('No level config given')
        this.hide()
        EventBroker.publish(new LevelSelectedEvent(this.levelConf))
        EventBroker.publish(new MaterialAmountChanged()) // XXX Remove workaround for UI redraw
    }

    private setupAndStartLevel() {
        if (!this.levelConf) throw new Error('No level config given')
        document.title = `${EncodingHelper.decodeString(this.levelConf.fullName)} - Rock Raiders Web`
        const params = new URLSearchParams(window.location.search)
        if (DEV_MODE) {
            params.set('entry', this.levelConf.levelName)
            history.pushState(null, '', `${window.location.pathname}?${params.toString()}`)
        }
        GameState.reset()
        this.entityMgr.reset()
        this.guiTopLeftLayer.reset()
        this.guiTopRightLayer.reset()
        this.guiBottomRightLayer.reset()
        this.guiBottomLeftLayer.reset()
        GameState.unassignedTeam = [...SaveGameManager.currentTeam]
        const fixedSeed = DEV_MODE ? params.get('randomSeed') : undefined
        if (fixedSeed) console.warn(`Using fixed random seed "${fixedSeed}"`)
        PRNG.setSeed(fixedSeed || Math.random().toString().substring(2))
        this.worldMgr.setup(this.levelConf)
        this.sceneMgr.setupScene(this.levelConf)
        // setup GUI
        this.overlayLayer.setupBriefing(this.levelConf)
        GameState.priorityList.setList(this.levelConf.priorities)
        // load in non-space objects next
        new ObjectListLoader(this.worldMgr, this.levelConf.disableStartTeleport).loadObjectList(this.levelConf.objectList)
        EventBroker.publish(new InitRadarMap(this.sceneMgr.birdViewControls.target.clone(), this.sceneMgr.terrain))
        // gather level start details for game result score calculation
        GameState.totalDiggables = this.sceneMgr.terrain.countDiggables()
        const crystalsInVehicles = [...this.entityMgr.vehicles, ...this.entityMgr.vehiclesUndiscovered].reduce((prev, v) => prev + v.stats.costCrystal, 0)
        const crystalsInBuildings = [...this.entityMgr.buildings, ...this.entityMgr.buildingsUndiscovered].reduce((prev, v) => prev + v.stats.costCrystal, 0)
        const crystalsDropped = [...this.entityMgr.materials, ...this.entityMgr.materialsUndiscovered].count((m) => m.entityType === EntityType.CRYSTAL || m.entityType === EntityType.DEPLETED_CRYSTAL)
        const crystalsInLevel = this.sceneMgr.terrain.countCrystals() + crystalsInVehicles + crystalsInBuildings + crystalsDropped
        GameState.totalCrystals = Math.max(this.levelConf?.reward?.quota?.crystals || 0, crystalsInLevel) // Level 20 has only 17 crystals but quota of 20
        GameState.totalOres = this.sceneMgr.terrain.countOres()
        GameState.noMultiSelect = this.levelConf.noMultiSelect
        this.show()
    }

    show() {
        this.gameLayer.show()
        this.selectionFrameLayer.show()
        this.advisorLayer.show()
        this.namingLayer.show()
        this.guiTopLeftLayer.show()
        this.guiTopRightLayer.show()
        this.guiBottomRightLayer.show()
        this.guiBottomLeftLayer.show()
        this.overlayLayer.show()
        this.sceneMgr.startScene().then(() => {
            this.worldMgr.start()
            this.overlayLayer.setActivePanel(SaveGameManager.preferences.skipBriefings ? undefined : this.overlayLayer.panelBriefing)
            this.screenMaster.loadingLayer.hide()
        }).catch((e) => {
            console.error(e)
            // TODO Show dedicated critical error layer or debug layer
        })
    }

    hide() {
        this.entityMgr.disposeAll()
        this.worldMgr.stop()
        this.sceneMgr.disposeScene()
        this.overlayLayer.hide()
        this.guiTopLeftLayer.hide()
        this.guiTopRightLayer.hide()
        this.guiBottomRightLayer.hide()
        this.guiBottomLeftLayer.hide()
        this.namingLayer.hide()
        this.advisorLayer.hide()
        this.selectionFrameLayer.hide()
        this.gameLayer.hide()
        document.title = 'Rock Raiders Web'
    }

    async startEndgameSequence(resultState: GameResultState) {
        if (!this.levelConf) throw new Error('No level config given')
        this.selectionFrameLayer.active = false
        this.guiTopLeftLayer.active = false
        this.guiTopRightLayer.active = false
        this.guiBottomRightLayer.active = false
        this.guiBottomLeftLayer.active = false
        this.overlayLayer.active = false
        // TODO Disable scene to avoid further selections
        EventBroker.publish(new DeselectAll())
        const numMaxAirRaiders = this.levelConf.oxygenRate ? this.entityMgr.buildings.count((b) => b.entityType === EntityType.BARRACKS) * ADDITIONAL_RAIDER_PER_SUPPORT : MAX_RAIDER_BASE
        const canvas = resultState === GAME_RESULT_STATE.complete ? await this.screenMaster.createScreenshot() : undefined
        const result = new GameResult(this.levelConf.fullName, this.levelConf.reward, resultState, this.entityMgr.buildings.length, this.entityMgr.raiders.length, numMaxAirRaiders, this.worldMgr.gameTimeMs, canvas)
        if (resultState === GAME_RESULT_STATE.complete) SaveGameManager.setLevelScore(this.levelConf.levelName, result.score)
        if (!this.levelConf.disableEndTeleport) await this.worldMgr.teleportEnd()
        this.worldMgr.stop()
        this.overlayLayer.showResultBriefing(resultState, this.levelConf, () => {
            this.hide()
            EventBroker.publish(new ShowGameResultEvent(result))
        })
    }
}
