import { MathUtils, Vector2 } from 'three'
import { Sample } from '../audio/Sample'
import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { NerpParser } from '../core/NerpParser'
import { NerpRunner } from '../core/NerpRunner'
import { clearIntervalSafe, getRandom } from '../core/Util'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { AirLevelChanged, RaidersChangedEvent } from '../event/LocalEvents'
import { JobCreateEvent, RequestedRaidersChanged } from '../event/WorldEvents'
import { CHECK_SPANW_RAIDER_TIMER, TILESIZE, UPDATE_OXYGEN_TIMER } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { RaiderActivity } from './model/activities/RaiderActivity'
import { BuildingEntity } from './model/building/BuildingEntity'
import { EntityType } from './model/EntityType'
import { GameState } from './model/GameState'
import { MoveJob } from './model/job/MoveJob'
import { MaterialEntity } from './model/material/MaterialEntity'
import { Raider } from './model/raider/Raider'
import { SceneManager } from './SceneManager'
import degToRad = MathUtils.degToRad

export class WorldManager {

    sceneMgr: SceneManager = null // TODO can be removed, when entities are decoupled from their scene mesh/entity
    nerpRunner: NerpRunner = null
    oxygenUpdateInterval = null
    spawnRaiderInterval = null
    oxygenRate: number = 0
    buildModeSelection: BuildingEntity = null

    constructor() {
        EventBus.registerEventListener(EventKey.CAVERN_DISCOVERED, () => {
            GameState.discoveredCaverns++
        })
        EventBus.registerEventListener(EventKey.REQUESTED_RAIDERS_CHANGED, () => {
            if (GameState.requestedRaiders > 0 && !this.spawnRaiderInterval) {
                this.spawnRaiderInterval = setInterval(this.checkSpawnRaiders.bind(this), CHECK_SPANW_RAIDER_TIMER)
            }
        })
    }

    setup(levelConf: LevelEntryCfg, onLevelEnd: () => any) {
        GameState.totalCaverns = levelConf.reward?.quota?.caverns || 0
        this.oxygenRate = levelConf.oxygenRate
        this.setBuildModeSelection(null)
        // load nerp script
        this.nerpRunner = NerpParser.parse(ResourceManager.getResource(levelConf.nerpFile))
        this.nerpRunner.messages.push(...(ResourceManager.getResource(levelConf.nerpMessageFile)))
        this.nerpRunner.onLevelEnd = onLevelEnd
    }

    start() {
        this.nerpRunner?.startExecution()
        this.oxygenUpdateInterval = setInterval(this.updateOxygen.bind(this), UPDATE_OXYGEN_TIMER)
        GameState.levelStartTime = Date.now()
    }

    stop() {
        GameState.levelStopTime = Date.now()
        this.spawnRaiderInterval = clearIntervalSafe(this.spawnRaiderInterval)
        this.oxygenUpdateInterval = clearIntervalSafe(this.oxygenUpdateInterval)
        this.nerpRunner?.pauseExecution()
        GameState.buildings.forEach((b) => b.removeFromScene())
        GameState.buildingsUndiscovered.forEach((b) => b.removeFromScene())
        GameState.raiders.forEach((r) => r.removeFromScene())
        GameState.raidersUndiscovered.forEach((r) => r.removeFromScene())
        GameState.materials.forEach((m) => m.removeFromScene())
        GameState.materialsUndiscovered.forEach((m) => m.removeFromScene())
        GameState.spiders.forEach((m) => m.removeFromScene())
        GameState.bats.forEach((b) => b.removeFromScene())
    }

    placeMaterial(item: MaterialEntity, worldPosition: Vector2) {
        item.addToScene(worldPosition, 0)
        if (item.sceneEntity.visible) {
            GameState.materials.push(item)
            EventBus.publishEvent(new JobCreateEvent(item.createCarryJob()))
        } else {
            GameState.materialsUndiscovered.push(item)
        }
        return item
    }

    updateOxygen() {
        const sum = GameState.raiders.map((r) => r.stats.OxygenCoef).reduce((l, r) => l + r, 0) +
            GameState.buildings.map((b) => b.isUsable() ? b.stats.OxygenCoef : 0).reduce((l, r) => l + r, 0)
        const rateMultiplier = 0.001
        const valuePerSecond = 1 / 25
        const msToSeconds = 0.001
        const diff = sum * this.oxygenRate * rateMultiplier * valuePerSecond * UPDATE_OXYGEN_TIMER * msToSeconds / 10
        const airLevel = Math.min(1, Math.max(0, GameState.airLevel + diff))
        if (GameState.airLevel !== airLevel) {
            GameState.airLevel = airLevel
            EventBus.publishEvent(new AirLevelChanged(GameState.airLevel))
        }
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
            EventBus.publishEvent(new RequestedRaidersChanged(GameState.requestedRaiders))
            station.spawning = true
            const raider = new Raider(this, this.sceneMgr)
            const heading = station.getHeading()
            raider.playPositionalAudio(Sample[Sample.SND_teleport], false)
            raider.changeActivity(RaiderActivity.TeleportIn, () => {
                station.spawning = false
                raider.changeActivity()
                raider.sceneEntity.createPickSphere(raider.stats.PickSphere, raider)
                const walkOutPos = station.getPosition2D().add(new Vector2(0, TILESIZE * 3 / 4 + getRandom(TILESIZE / 2))
                    .rotateAround(new Vector2(0, 0), heading + degToRad(-10 + getRandom(20))))
                raider.setJob(new MoveJob(walkOutPos))
                GameState.raiders.push(raider)
                EventBus.publishEvent(new RaidersChangedEvent())
            })
            raider.addToScene(new Vector2(0, TILESIZE / 2).rotateAround(new Vector2(0, 0), station.getHeading()).add(station.getPosition2D()), heading)
        }
    }

    setBuildModeSelection(building: BuildingEntity) {
        this.buildModeSelection?.removeFromScene()
        this.buildModeSelection = building
    }

}
