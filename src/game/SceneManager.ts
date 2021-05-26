import { AmbientLight, AudioListener, Color, Frustum, Intersection, Mesh, MOUSE, PerspectiveCamera, PointLight, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three'
import { MapControls } from 'three/examples/jsm/controls/OrbitControls'
import { Sample } from '../audio/Sample'
import { SoundManager } from '../audio/SoundManager'
import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { clearIntervalSafe } from '../core/Util'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { SelectionChanged } from '../event/LocalEvents'
import { KEY_PAN_SPEED, TILESIZE } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { SceneMesh } from '../scene/SceneMesh'
import { DebugHelper } from '../screen/DebugHelper'
import { EntityManager } from './EntityManager'
import { BuildingEntity } from './model/building/BuildingEntity'
import { BuildPlacementMarker } from './model/building/BuildPlacementMarker'
import { GameState } from './model/GameState'
import { Terrain } from './model/map/Terrain'
import { Selectable, SelectionType } from './model/Selectable'
import { TerrainLoader } from './TerrainLoader'
import { WorldManager } from './WorldManager'

export class SceneManager {

    static meshRegistry: SceneMesh[] = []

    worldMgr: WorldManager
    entityMgr: EntityManager
    maxFps: number = 30 // most animations use 25 fps so this should be enough
    renderer: WebGLRenderer
    debugHelper: DebugHelper = new DebugHelper()
    renderInterval
    animRequest
    scene: Scene
    listener: AudioListener
    camera: PerspectiveCamera
    ambientLight: AmbientLight
    light: PointLight
    terrain: Terrain
    controls: MapControls
    cursorTorchlight: PointLight
    buildMarker: BuildPlacementMarker

    constructor(canvas: SpriteImage) {
        this.renderer = new WebGLRenderer({antialias: true, canvas: canvas})
        this.renderer.setClearColor(0x000000)

        this.listener = new AudioListener()

        this.camera = new PerspectiveCamera(30, canvas.width / canvas.height, 0.1, 5000) // TODO make these params configurable
        this.camera.add(this.listener)

        this.controls = new MapControls(this.camera, this.renderer.domElement)
        this.controls.mouseButtons = {LEFT: null, MIDDLE: MOUSE.ROTATE, RIGHT: MOUSE.PAN}
        // this.controls.maxPolarAngle = Math.PI * 0.45; // TODO dynamically adapt to terrain height at camera position
        this.controls.listenToKeyEvents(this.renderer.domElement)
        this.controls.keyPanSpeed = this.controls.keyPanSpeed * KEY_PAN_SPEED

        EventBus.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            if (event.selectionType === SelectionType.NOTHING) this.selectEntities([])
        })
    }

    getSelectionByRay(rx: number, ry: number): Selectable[] {
        const raycaster = new Raycaster()
        raycaster.setFromCamera({x: rx, y: ry}, this.camera)
        let selection = SceneManager.getSelection(raycaster.intersectObjects(this.entityMgr.raiders.map((r) => r.sceneEntity.pickSphere)))
        if (selection.length < 1) selection = SceneManager.getSelection(raycaster.intersectObjects(this.entityMgr.vehicles.map((v) => v.sceneEntity.pickSphere)))
        if (selection.length < 1) selection = SceneManager.getSelection(raycaster.intersectObjects(this.entityMgr.buildings.map((b) => b.sceneEntity.pickSphere)))
        if (selection.length < 1 && this.terrain) selection = SceneManager.getSelection(raycaster.intersectObjects(this.terrain.floorGroup.children))
        return selection
    }

    private static getSelection(intersects: Intersection[]): Selectable[] {
        if (intersects.length < 1) return []
        const selected = []
        if (intersects.length > 0) {
            const userData = intersects[0].object.userData
            if (userData && userData.hasOwnProperty('selectable')) {
                const selectable = userData['selectable'] as Selectable
                if (selectable?.isSelectable() || selectable?.selected) selected.push(selectable)
            }
        }
        return selected
    }

    selectEntitiesInFrustum(r1x: number, r1y: number, r2x: number, r2y: number) {
        const startPoint = new Vector3(r1x, r1y, 0.5)
        const endPoint = new Vector3(r2x, r2y, 0.5)
        // Avoid invalid frustum
        if (startPoint.x === endPoint.x) {
            endPoint.x += Number.EPSILON
        }
        if (startPoint.y === endPoint.y) {
            endPoint.y += Number.EPSILON
        }
        // update camera
        this.camera.updateProjectionMatrix()
        this.camera.updateMatrixWorld()
        // update frustum
        const tmpPoint = new Vector3()
        tmpPoint.copy(startPoint)
        tmpPoint.x = Math.min(startPoint.x, endPoint.x)
        tmpPoint.y = Math.max(startPoint.y, endPoint.y)
        endPoint.x = Math.max(startPoint.x, endPoint.x)
        endPoint.y = Math.min(startPoint.y, endPoint.y)

        const vecNear = new Vector3()
        const vecTopLeft = new Vector3()
        const vecTopRight = new Vector3()
        const vecDownRight = new Vector3()
        const vecDownLeft = new Vector3()
        vecNear.setFromMatrixPosition(this.camera.matrixWorld)
        vecTopLeft.copy(tmpPoint)
        vecTopRight.set(endPoint.x, tmpPoint.y, 0)
        vecDownRight.copy(endPoint)
        vecDownLeft.set(tmpPoint.x, endPoint.y, 0)

        vecTopLeft.unproject(this.camera)
        vecTopRight.unproject(this.camera)
        vecDownRight.unproject(this.camera)
        vecDownLeft.unproject(this.camera)

        const vectemp1 = new Vector3()
        const vectemp2 = new Vector3()
        const vectemp3 = new Vector3()
        vectemp1.copy(vecTopLeft).sub(vecNear)
        vectemp2.copy(vecTopRight).sub(vecNear)
        vectemp3.copy(vecDownRight).sub(vecNear)
        vectemp1.normalize()
        vectemp2.normalize()
        vectemp3.normalize()

        const deep = Number.MAX_VALUE
        vectemp1.multiplyScalar(deep)
        vectemp2.multiplyScalar(deep)
        vectemp3.multiplyScalar(deep)
        vectemp1.add(vecNear)
        vectemp2.add(vecNear)
        vectemp3.add(vecNear)

        const frustum = new Frustum()
        const planes = frustum.planes

        planes[0].setFromCoplanarPoints(vecNear, vecTopLeft, vecTopRight)
        planes[1].setFromCoplanarPoints(vecNear, vecTopRight, vecDownRight)
        planes[2].setFromCoplanarPoints(vecDownRight, vecDownLeft, vecNear)
        planes[3].setFromCoplanarPoints(vecDownLeft, vecTopLeft, vecNear)
        planes[4].setFromCoplanarPoints(vecTopRight, vecDownRight, vecDownLeft)
        planes[5].setFromCoplanarPoints(vectemp3, vectemp2, vectemp1)
        planes[5].normal.multiplyScalar(-1)

        let entities: Selectable[] = this.entityMgr.raiders.filter((r) => SceneManager.isInFrustum(r.sceneEntity.pickSphere, frustum))
        entities.push(...this.entityMgr.vehicles.filter((v) => SceneManager.isInFrustum(v.sceneEntity.pickSphere, frustum)))
        if (entities.length < 1) {
            const firstBuilding = this.entityMgr.buildings.find((b) => SceneManager.isInFrustum(b.sceneEntity.pickSphere, frustum))
            entities = firstBuilding ? [firstBuilding] : []
        }
        this.selectEntities(entities)
    }

    private static isInFrustum(pickSphere: Mesh, frustum: Frustum) {
        if (!pickSphere) return false
        const selectionCenter = new Vector3()
        pickSphere.getWorldPosition(selectionCenter)
        return frustum.containsPoint(selectionCenter)
    }

    selectEntities(entities: Selectable[]) {
        this.entityMgr.selectedEntities = this.entityMgr.selectedEntities.filter((previouslySelected) => {
            const stillSelected = entities.indexOf(previouslySelected) !== -1
            if (!stillSelected) previouslySelected.deselect()
            return stillSelected
        })
        // add new entities that are selectable
        let addedSelected = false
        entities.forEach((freshlySelected) => {
            if (freshlySelected.select()) {
                addedSelected = true
                this.entityMgr.selectedEntities.push(freshlySelected)
            }
        })
        if (addedSelected) SoundManager.playSample(Sample.SFX_Okay)
        // determine and set next selection type
        const len = this.entityMgr.selectedEntities.length
        if (len > 1) {
            this.entityMgr.selectionType = SelectionType.GROUP
        } else if (len === 1) {
            this.entityMgr.selectionType = this.entityMgr.selectedEntities[0].getSelectionType()
        } else if (this.entityMgr.selectionType !== null) {
            this.entityMgr.selectionType = SelectionType.NOTHING
        }
        // AFTER updating selected entities and selection type, publish all events
        EventBus.publishEvent(new SelectionChanged(this.entityMgr))
    }

    setupScene(levelConf: LevelEntryCfg) {
        this.scene = new Scene()

        const ambientRgb = ResourceManager.cfg('Main', 'AmbientRGB') || [10, 10, 10]
        const maxAmbRgb = Math.min(255, Math.max(0, ...ambientRgb))
        const normalizedRgb = ambientRgb.map(v => v / (maxAmbRgb ? maxAmbRgb : 1))
        const ambientColor = new Color(normalizedRgb[0], normalizedRgb[1], normalizedRgb[2])
        this.ambientLight = new AmbientLight(ambientColor, 0.4)
        this.scene.add(this.ambientLight)

        this.cursorTorchlight = new PointLight(0xffffff, 1.5, 4, 1)
        this.cursorTorchlight.distance *= TILESIZE
        this.scene.add(this.cursorTorchlight)

        this.buildMarker = new BuildPlacementMarker(this.worldMgr, this, this.entityMgr)
        this.scene.add(this.buildMarker.group)
        this.setBuildModeSelection(null)

        // create terrain mesh and add it to the scene
        this.terrain = TerrainLoader.loadTerrain(levelConf, this, this.entityMgr)
        this.scene.add(this.terrain.floorGroup)

        // gather level start details for game result score calculation
        GameState.totalDiggables = this.terrain.countDiggables()
        GameState.totalCrystals = this.terrain.countCrystals()
        GameState.totalOres = this.terrain.countOres()
    }

    startScene() {
        this.debugHelper.show()
        this.renderInterval = setInterval(() => {
            this.animRequest = requestAnimationFrame(() => {
                this.debugHelper.renderStart()
                this.renderer.render(this.scene, this.camera)
                this.debugHelper.renderDone()
            })
        }, 1000 / this.maxFps)
    }

    disposeScene() {
        this.debugHelper.hide()
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        if (this.animRequest) {
            cancelAnimationFrame(this.animRequest)
            this.animRequest = null
        }
        GameState.remainingDiggables = this.terrain?.countDiggables() || 0
        this.terrain?.dispose()
        this.terrain = null
        SceneManager.meshRegistry.forEach(mesh => mesh.dispose())
        SceneManager.meshRegistry = []
    }

    static registerMesh(mesh: SceneMesh): SceneMesh {
        this.meshRegistry.push(mesh)
        return mesh
    }

    resize(width: number, height: number) {
        this.renderer.setSize(width, height)
    }

    getTerrainIntersectionPoint(rx: number, ry: number): Vector2 {
        if (!this.terrain) return null
        const raycaster = new Raycaster()
        raycaster.setFromCamera({x: rx, y: ry}, this.camera)
        const intersects = raycaster.intersectObjects(this.terrain.floorGroup.children)
        return intersects.length > 0 ? new Vector2(intersects[0].point.x, intersects[0].point.z) : null
    }

    setTorchPosition(position: Vector2) {
        this.cursorTorchlight.position.copy(this.getFloorPosition(position))
        this.cursorTorchlight.position.y += 2 * TILESIZE
    }

    getFloorPosition(world: Vector2) {
        const floorY = this.terrain.getSurfaceFromWorldXZ(world.x, world.y).getFloorHeight(world.x, world.y)
        return new Vector3(world.x, floorY, world.y)
    }

    hasBuildModeSelection(): boolean {
        return !!this.buildMarker?.buildModeSelection
    }

    setBuildModeSelection(building: BuildingEntity) {
        this.buildMarker.buildModeSelection?.removeFromScene()
        this.buildMarker.buildModeSelection = building
        if (!building) this.buildMarker.hideAllMarker()
    }

}
