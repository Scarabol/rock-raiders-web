import { AmbientLight, AudioListener, Color, Frustum, Intersection, Mesh, MOUSE, PerspectiveCamera, PointLight, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three'
import { MapControls } from 'three/examples/jsm/controls/OrbitControls'
import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { cloneContext } from '../core/ImageHelper'
import { clearIntervalSafe } from '../core/Util'
import { CAMERA_MAX_DISTANCE, CAMERA_MIN_DISTANCE, DEV_MODE, KEY_PAN_SPEED, TILESIZE } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { DebugHelper } from '../screen/DebugHelper'
import { EntityManager } from './EntityManager'
import { BuildingEntity } from './model/building/BuildingEntity'
import { BuildPlacementMarker } from './model/building/BuildPlacementMarker'
import { GameSelection } from './model/GameSelection'
import { GameState } from './model/GameState'
import { Surface } from './model/map/Surface'
import { Terrain } from './model/map/Terrain'
import { MaterialEntity } from './model/material/MaterialEntity'
import { Selectable } from './model/Selectable'
import { VehicleEntity } from './model/vehicle/VehicleEntity'
import { TerrainLoader } from './TerrainLoader'
import { WorldManager } from './WorldManager'

export class SceneManager {
    worldMgr: WorldManager
    entityMgr: EntityManager
    maxFps: number = 30 // most animations use 25 fps so this should be enough
    renderer: WebGLRenderer
    debugHelper: DebugHelper = new DebugHelper()
    renderInterval: NodeJS.Timeout
    animRequest: number
    scene: Scene
    listener: AudioListener
    camera: PerspectiveCamera
    ambientLight: AmbientLight
    light: PointLight
    terrain: Terrain
    controls: MapControls
    cursorTorchlight: PointLight
    buildMarker: BuildPlacementMarker
    screenshotCallback: (canvas: HTMLCanvasElement) => any

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
        if (!DEV_MODE) {
            this.controls.minDistance = CAMERA_MIN_DISTANCE * TILESIZE
            this.controls.maxDistance = CAMERA_MAX_DISTANCE * TILESIZE
        }
    }

    getSelectionByRay(rx: number, ry: number): GameSelection {
        const raycaster = new Raycaster()
        raycaster.setFromCamera({x: rx, y: ry}, this.camera)
        const selection = new GameSelection()
        selection.raiders.push(...SceneManager.getSelection(raycaster.intersectObjects(this.entityMgr.raiders.map((r) => r.sceneEntity.pickSphere)), false))
        if (selection.isEmpty()) selection.vehicles.push(...SceneManager.getSelection(raycaster.intersectObjects(this.entityMgr.vehicles.map((v) => v.sceneEntity.pickSphere)), true))
        if (selection.isEmpty()) selection.building = SceneManager.getSelection(raycaster.intersectObjects(this.entityMgr.buildings.map((b) => b.sceneEntity.pickSphere)), true)[0]
        if (selection.isEmpty()) selection.fence = SceneManager.getSelection(raycaster.intersectObjects(this.entityMgr.placedFences.map((f) => f.sceneEntity.pickSphere)), false)[0]
        if (selection.isEmpty() && this.terrain) selection.surface = SceneManager.getSelection(raycaster.intersectObjects(this.terrain.floorGroup.children), false)[0]
        return selection
    }

    private static getSelection(intersects: Intersection[], allowDoubleSelection: boolean): any[] {
        if (intersects.length < 1) return []
        const selection = []
        const userData = intersects[0].object.userData
        if (userData && userData.hasOwnProperty('selectable')) {
            const selectable = userData['selectable'] as Selectable
            if (selectable?.isInSelection() || (selectable?.selected && allowDoubleSelection)) selection.push(selectable)
        }
        return selection
    }

    getFirstByRay(rx: number, ry: number): { vehicle?: VehicleEntity, material?: MaterialEntity, surface?: Surface } {
        const raycaster = new Raycaster()
        raycaster.setFromCamera({x: rx, y: ry}, this.camera)
        const vehicle = SceneManager.getSelectable(raycaster.intersectObjects(this.entityMgr.vehicles.map((v) => v.sceneEntity.pickSphere)))
        if (vehicle) return {vehicle: vehicle}
        const materialEntity = SceneManager.getMaterialEntity(raycaster.intersectObjects(this.entityMgr.materials.map((m) => m.sceneEntity.pickSphere).filter((p) => !!p)))
        if (materialEntity) return {material: materialEntity}
        if (this.terrain) {
            const surface = SceneManager.getSelectable(raycaster.intersectObjects(this.terrain.floorGroup.children))
            if (surface) return {surface: surface}
        }
        return null
    }

    private static getSelectable(intersects: Intersection[]) {
        return intersects[0]?.object?.userData?.selectable || null
    }

    private static getMaterialEntity(intersects: Intersection[]): MaterialEntity {
        return intersects[0]?.object?.userData?.materialEntity || null
    }

    getEntitiesInFrustum(r1x: number, r1y: number, r2x: number, r2y: number): GameSelection {
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

        const selection = new GameSelection()
        selection.raiders.push(...this.entityMgr.raiders.filter((r) => r.isInSelection() && SceneManager.isInFrustum(r.sceneEntity.pickSphere, frustum)))
        const hasRaiderSelected = selection.raiders.length > 0
        selection.vehicles.push(...this.entityMgr.vehicles.filter((v) => v.isInSelection() && (!hasRaiderSelected || v.driver) && SceneManager.isInFrustum(v.sceneEntity.pickSphere, frustum)))
        if (selection.isEmpty()) selection.building = this.entityMgr.buildings.find((b) => SceneManager.isInFrustum(b.sceneEntity.pickSphere, frustum))
        return selection
    }

    private static isInFrustum(pickSphere: Mesh, frustum: Frustum) {
        if (!pickSphere) return false
        const selectionCenter = new Vector3()
        pickSphere.getWorldPosition(selectionCenter)
        return frustum.containsPoint(selectionCenter)
    }

    setupScene(levelConf: LevelEntryCfg) {
        this.scene = new Scene()

        const ambientRgb: number[] = ResourceManager.cfg('Main', 'AmbientRGB') || [10, 10, 10]
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
        TerrainLoader.loadTerrain(levelConf, this, this.entityMgr)

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
                this.checkForScreenshot()
            })
        }, 1000 / this.maxFps)
    }

    private checkForScreenshot() {
        if (!this.screenshotCallback) return
        const callback = this.screenshotCallback
        this.screenshotCallback = null
        this.renderer.domElement.toBlob((blob) => {
            const img = document.createElement('img')
            img.onload = () => {
                const context = cloneContext(this.renderer.domElement)
                context.drawImage(img, 0, 0)
                callback(context.canvas)
            }
            img.src = URL.createObjectURL(blob)
        })
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
        this.buildMarker.buildModeSelection?.disposeFromWorld()
        this.buildMarker.buildModeSelection = building
        if (!building) this.buildMarker.hideAllMarker()
    }
}
