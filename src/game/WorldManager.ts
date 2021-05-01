import { Color, MathUtils, Raycaster, Vector2, Vector3 } from 'three'
import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { NerpParser } from '../core/NerpParser'
import { NerpRunner } from '../core/NerpRunner'
import { clearIntervalSafe, getRandom } from '../core/Util'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { AirLevelChanged } from '../event/LocalEvents'
import { EntityAddedEvent, JobCreateEvent, RaiderRequested, SpawnDynamiteEvent } from '../event/WorldEvents'
import { CHECK_SPANW_RAIDER_TIMER, TILESIZE, UPDATE_OXYGEN_TIMER } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { GameScreen } from '../screen/GameScreen'
import { RaiderActivity } from './model/activities/RaiderActivity'
import { Dynamite } from './model/collect/Dynamite'
import { MaterialEntity } from './model/collect/MaterialEntity'
import { EntityType } from './model/EntityType'
import { GameState } from './model/GameState'
import { CollectJob } from './model/job/CollectJob'
import { MoveJob } from './model/job/MoveJob'
import { DynamiteJob } from './model/job/surface/DynamiteJob'
import { Raider } from './model/raider/Raider'
import { ObjectListLoader } from './ObjectListLoader'
import { SceneManager } from './SceneManager'
import { TerrainLoader } from './TerrainLoader'
import degToRad = MathUtils.degToRad

export class WorldManager {

    sceneManager: SceneManager = null
    spawnRaiderInterval = null
    nerpRunner: NerpRunner = null
    oxygenUpdateInterval = null

    constructor(canvas: HTMLCanvasElement) {
        this.sceneManager = new SceneManager(canvas)
        EventBus.registerEventListener(EventKey.DESELECTED_ENTITY, () => GameState.selectEntities([]))
        EventBus.registerEventListener(EventKey.RAIDER_REQUESTED, () => {
            if (GameState.requestedRaiders > 0 && !this.spawnRaiderInterval) {
                this.spawnRaiderInterval = setInterval(this.checkSpawnRaiders.bind(this), CHECK_SPANW_RAIDER_TIMER)
            }
        })
        EventBus.registerEventListener(EventKey.SPAWN_DYNAMITE, (event: SpawnDynamiteEvent) => {
            const targetBuilding = GameState.getClosestBuildingByType(event.surface.getCenterWorld(), EntityType.TOOLSTATION)
            if (!targetBuilding) throw 'Could not find toolstation to spawn dynamite'
            const dynamite = new Dynamite()
            dynamite.targetSurface = event.surface
            dynamite.worldMgr = this
            dynamite.group.position.copy(targetBuilding.getDropPosition())
            this.sceneManager.scene.add(dynamite.group)
            EventBus.publishEvent(new JobCreateEvent(new DynamiteJob(event.surface, dynamite)))
        })
        EventBus.registerEventListener(EventKey.CAVERN_DISCOVERED, () => {
            GameState.discoveredCaverns++
        })
        this.oxygenUpdateInterval = setInterval(this.updateOxygen.bind(this), UPDATE_OXYGEN_TIMER)
    }

    setup(levelConf: LevelEntryCfg, gameScreen: GameScreen) {
        GameState.levelFullName = levelConf.fullName
        GameState.totalCaverns = levelConf.reward?.quota?.caverns || 0
        GameState.rewardConfig = levelConf.reward
        GameState.priorityList.setList(levelConf.priorities)
        GameState.oxygenRate = levelConf.oxygenRate

        const ambientRgb = ResourceManager.cfg('Main', 'AmbientRGB') || [10, 10, 10]
        const maxAmbRgb = Math.min(255, Math.max(0, ...ambientRgb))
        const normalizedRgb = ambientRgb.map(v => v / (maxAmbRgb ? maxAmbRgb : 1))
        const ambientColor = new Color(normalizedRgb[0], normalizedRgb[1], normalizedRgb[2])
        this.sceneManager.setupScene(ambientColor)

        // create terrain mesh and add it to the scene
        this.sceneManager.terrain = TerrainLoader.loadTerrain(levelConf, this)
        this.sceneManager.scene.add(this.sceneManager.terrain.floorGroup)

        // load in non-space objects next
        const objectListConf = ResourceManager.getResource(levelConf.oListFile)
        ObjectListLoader.loadObjectList(this, objectListConf, levelConf.disableStartTeleport)

        // load nerp script
        this.nerpRunner = NerpParser.parse(ResourceManager.getResource(levelConf.nerpFile))
        this.nerpRunner.messages.push(...(ResourceManager.getResource(levelConf.nerpMessageFile)))
        this.nerpRunner.onLevelComplete = () => gameScreen.onLevelEnd()

        // gather level start details for game result score calculation
        GameState.totalDiggables = 0
        this.sceneManager.terrain.forEachSurface((s) => GameState.totalDiggables += s.isDigable() ? 1 : 0)
        GameState.totalCrystals = 0
        this.sceneManager.terrain.forEachSurface((s) => GameState.totalCrystals += s.containedCrystals)
        GameState.totalOres = 0
        this.sceneManager.terrain.forEachSurface((s) => GameState.totalOres += s.containedOres)
    }

    start() {
        this.sceneManager.startScene()
        this.nerpRunner?.startExecution()
        GameState.levelStartTime = Date.now()
    }

    stop() {
        GameState.levelStopTime = Date.now()
        this.nerpRunner?.pauseExecution()
        this.spawnRaiderInterval = clearIntervalSafe(this.spawnRaiderInterval)
        GameState.spiders.forEach((m) => m.onLevelEnd())
        GameState.bats.forEach((b) => b.onLevelEnd())
        GameState.remainingDiggables = 0
        this.sceneManager?.terrain?.forEachSurface((s) => GameState.remainingDiggables += s.isDigable() ? 1 : 0)
        this.sceneManager.disposeScene()
    }

    resize(width: number, height: number) {
        if (this.sceneManager) this.sceneManager.renderer.setSize(width, height)
    }

    getTerrainIntersectionPoint(rx: number, ry: number): Vector3 {
        if (!this.sceneManager.terrain) return null
        const raycaster = new Raycaster()
        raycaster.setFromCamera({x: rx, y: ry}, this.sceneManager.camera)
        const intersects = raycaster.intersectObjects(this.sceneManager.terrain.floorGroup.children)
        return intersects.length > 0 ? intersects[0].point : null
    }

    setTorchPosition(position: Vector2) {
        this.sceneManager.cursorTorchlight.position.x = position.x
        this.sceneManager.cursorTorchlight.position.y = this.sceneManager.terrain.getSurfaceFromWorldXZ(position.x, position.y).getFloorHeight(position.x, position.y) + 2 * TILESIZE
        this.sceneManager.cursorTorchlight.position.z = position.y
    }

    getFloorPosition(world: Vector2) {
        const floorY = this.sceneManager.terrain.getSurfaceFromWorldXZ(world.x, world.y).getFloorHeight(world.x, world.y)
        return new Vector3(world.x, floorY, world.y)
    }

    getTerrainHeight(worldX: number, worldZ: number): number {
        const raycaster = new Raycaster(new Vector3(Number(worldX), 3 * TILESIZE, Number(worldZ)), new Vector3(0, -1, 0))
        const intersect = raycaster.intersectObject(this.sceneManager.terrain.floorGroup, true)
        if (intersect.length > 0) {
            return intersect[0].point.y
        } else {
            console.warn('could not determine terrain height for ' + worldX + '/' + worldZ)
            return 0
        }
    }

    placeMaterial(item: MaterialEntity, world: Vector2) {
        item.worldMgr = this
        item.group.position.copy(this.getFloorPosition(world))
        item.group.visible = this.sceneManager.terrain.getSurfaceFromWorld(item.group.position).discovered
        this.sceneManager.scene.add(item.group)
        if (item.group.visible) {
            GameState.materials.push(item)
            EventBus.publishEvent(new JobCreateEvent(new CollectJob(item)))
        } else {
            GameState.materialsUndiscovered.push(item)
        }
        return item
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
            const raider = new Raider()
            raider.worldMgr = this
            raider.changeActivity(RaiderActivity.TeleportIn, () => {
                station.spawning = false
                raider.changeActivity()
                raider.createPickSphere()
                const walkOutPos = station.getPosition2D().add(new Vector2(0, TILESIZE * 3 / 4 + getRandom(TILESIZE / 2))
                    .rotateAround(new Vector2(0, 0), station.getHeading() + degToRad(-10 + getRandom(20))))
                raider.setJob(new MoveJob(walkOutPos))
                GameState.raiders.push(raider)
                EventBus.publishEvent(new EntityAddedEvent(raider))
            })
            raider.group.position.copy(station.group.position).add(new Vector3(0, 0, TILESIZE / 2).applyEuler(station.group.rotation))
            raider.group.rotation.copy(station.group.rotation)
            this.sceneManager.scene.add(raider.group)
        }
    }

    updateOxygen() {
        const sum = GameState.raiders.map((r) => r.stats.OxygenCoef).reduce((l, r) => l + r, 0) +
            GameState.buildings.map((b) => b.stats.OxygenCoef).reduce((l, r) => l + r, 0)
        const rateMultiplier = 0.001
        const valuePerSecond = 1 / 25
        const msToSeconds = 0.001
        const diff = sum * GameState.oxygenRate * rateMultiplier * valuePerSecond * UPDATE_OXYGEN_TIMER * msToSeconds / 10
        if (diff) {
            GameState.airLevel = Math.min(1, Math.max(0, GameState.airLevel + diff))
            EventBus.publishEvent(new AirLevelChanged())
        }
    }

}
