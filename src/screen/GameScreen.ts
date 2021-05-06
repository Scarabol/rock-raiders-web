import { MathUtils, Vector2 } from 'three'
import { LevelObjectiveTextEntry } from '../cfg/LevelObjectiveTextEntry'
import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { clearIntervalSafe, getRandom, iGet } from '../core/Util'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { EntityAddedEvent, RaiderRequested } from '../event/WorldEvents'
import { RaiderActivity } from '../game/model/activities/RaiderActivity'
import { EntityType } from '../game/model/EntityType'
import { GameState } from '../game/model/GameState'
import { MoveJob } from '../game/model/job/MoveJob'
import { Raider } from '../game/model/raider/Raider'
import { ObjectListLoader } from '../game/ObjectListLoader'
import { SceneManager } from '../game/SceneManager'
import { Supervisor } from '../game/Supervisor'
import { WorldManager } from '../game/WorldManager'
import { CHECK_SPANW_RAIDER_TIMER, TILESIZE } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { BaseScreen } from './BaseScreen'
import { GameLayer } from './layer/GameLayer'
import { GuiMainLayer } from './layer/GuiMainLayer'
import { OverlayLayer } from './layer/OverlayLayer'
import { SelectionLayer } from './layer/SelectionLayer'
import degToRad = MathUtils.degToRad

export class GameScreen extends BaseScreen {

    onLevelEnd: () => void = () => console.log('Level aborted')
    gameLayer: GameLayer
    selectionLayer: SelectionLayer
    guiLayer: GuiMainLayer
    overlayLayer: OverlayLayer
    worldMgr: WorldManager
    sceneMgr: SceneManager
    spawnRaiderInterval = null
    jobSupervisor: Supervisor
    levelName: string
    levelConf: LevelEntryCfg

    constructor() {
        super()
        this.gameLayer = this.addLayer(new GameLayer(), 0)
        this.selectionLayer = this.addLayer(new SelectionLayer(), 10)
        this.guiLayer = this.addLayer(new GuiMainLayer(), 20)
        this.overlayLayer = this.addLayer(new OverlayLayer(), 30)
        this.worldMgr = new WorldManager()
        this.gameLayer.worldMgr = this.worldMgr
        this.sceneMgr = new SceneManager(this.gameLayer.canvas)
        this.gameLayer.sceneMgr = this.sceneMgr
        this.selectionLayer.sceneMgr = this.sceneMgr
        this.jobSupervisor = new Supervisor(this.worldMgr)
        // link layer
        this.guiLayer.onOptionsShow = () => this.overlayLayer.panelOptions.show()
        this.overlayLayer.panelBriefing.messagePanel = this.guiLayer.panelMessages
        this.overlayLayer.panelPause.onAbortGame = () => this.onLevelEnd()
        this.overlayLayer.panelPause.onRestartGame = () => this.restartLevel()
        EventBus.registerEventListener(EventKey.RAIDER_REQUESTED, () => {
            if (GameState.requestedRaiders > 0 && !this.spawnRaiderInterval) {
                this.spawnRaiderInterval = setInterval(this.checkSpawnRaiders.bind(this), CHECK_SPANW_RAIDER_TIMER)
            }
        })
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
        this.worldMgr.setup(this.levelConf, () => this.onLevelEnd())
        this.sceneMgr.setupScene(this.levelConf, this.worldMgr)
        // load in non-space objects next
        const objectListConf = ResourceManager.getResource(this.levelConf.oListFile)
        ObjectListLoader.loadObjectList(this.worldMgr, this.sceneMgr, objectListConf, this.levelConf.disableStartTeleport)
        // setup GUI
        const objectiveText: LevelObjectiveTextEntry = iGet(ResourceManager.getResource(this.levelConf.objectiveText), this.levelName)
        this.guiLayer.reset()
        this.overlayLayer.setup(objectiveText.objective, this.levelConf.objectiveImage640x480)
        this.show()
    }

    show() {
        super.show()
        this.sceneMgr.startScene()
        this.worldMgr.start()
        this.jobSupervisor.start()
    }

    hide() {
        this.spawnRaiderInterval = clearIntervalSafe(this.spawnRaiderInterval)
        this.jobSupervisor.stop()
        this.worldMgr.stop()
        this.sceneMgr.disposeScene()
        super.hide()
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        this.sceneMgr?.resize(width, height)
    }

    checkSpawnRaiders() {
        if (GameState.requestedRaiders < 1) {
            this.spawnRaiderInterval = clearIntervalSafe(this.spawnRaiderInterval)
            return
        }
        if (GameState.raiders.length >= GameState.getMaxRaiders()) return
        const spawnBuildings = GameState.getBuildingsByType(EntityType.TOOLSTATION, EntityType.TELEPORT_PAD)
        for (let c = 0; c < spawnBuildings.length && GameState.requestedRaiders > 0; c++) {
            const station = spawnBuildings[c]
            if (station.spawning) continue
            GameState.requestedRaiders--
            EventBus.publishEvent(new RaiderRequested())
            station.spawning = true
            const raider = new Raider(this.worldMgr, this.sceneMgr)
            const heading = station.getHeading()
            raider.changeActivity(RaiderActivity.TeleportIn, () => {
                station.spawning = false
                raider.changeActivity()
                raider.createPickSphere()
                const walkOutPos = station.getPosition2D().add(new Vector2(0, TILESIZE * 3 / 4 + getRandom(TILESIZE / 2))
                    .rotateAround(new Vector2(0, 0), heading + degToRad(-10 + getRandom(20))))
                raider.setJob(new MoveJob(walkOutPos))
                GameState.raiders.push(raider)
                EventBus.publishEvent(new EntityAddedEvent(raider))
            })
            raider.addToScene(new Vector2(0, TILESIZE / 2).rotateAround(new Vector2(0, 0), station.getHeading()).add(station.getPosition2D()), heading)
        }
    }

}
