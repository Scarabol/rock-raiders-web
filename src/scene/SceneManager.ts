import { AmbientLight, Frustum, MOUSE, PerspectiveCamera, PointLight, Raycaster, Scene, Vector3, WebGLRenderer } from 'three'
import { DebugHelper } from './DebugHelper'
import { MapControls } from 'three/examples/jsm/controls/OrbitControls'
import { GameState } from '../game/model/GameState'
import { Selectable } from '../game/model/Selectable'
import { Terrain } from './model/map/Terrain'

export class SceneManager {

    maxFps: number = 30 // most animations use 25 fps so this should be enough
    renderer: WebGLRenderer
    debugHelper: DebugHelper = new DebugHelper()
    renderInterval
    animRequest
    scene: Scene
    camera: PerspectiveCamera
    amb: AmbientLight
    light: PointLight
    terrain: Terrain
    controls: MapControls
    cursorTorchlight: PointLight

    constructor(canvas: HTMLCanvasElement) {
        this.renderer = new WebGLRenderer({antialias: true, canvas: canvas})
        this.renderer.setClearColor(0x000000)

        this.scene = new Scene()
        // this.scene.fog = new FogExp2(0x6e6e9b, 0.05); // TODO derive from level config

        this.amb = new AmbientLight(0x808080) // TODO use "cave" light setup
        this.scene.add(this.amb)

        this.cursorTorchlight = new PointLight(0xffffff, 1, 7, 2)
        this.scene.add(this.cursorTorchlight)

        this.camera = new PerspectiveCamera(30, canvas.width / canvas.height, 0.1, 5000) // TODO make these params configurable

        this.controls = new MapControls(this.camera, this.renderer.domElement)
        this.controls.mouseButtons = {LEFT: null, MIDDLE: MOUSE.ROTATE, RIGHT: MOUSE.PAN}
        // this.controls.maxPolarAngle = Math.PI * 0.45; // TODO dynamically adapt to terrain height at camera position
    }

    selectEntitiesByRay(rx: number, ry: number) {
        const raycaster = new Raycaster()
        raycaster.setFromCamera({x: rx, y: ry}, this.camera)
        let intersects = raycaster.intersectObjects(GameState.raiders.map((r) => r.pickSphere))
        if (intersects.length < 1) intersects = raycaster.intersectObjects(GameState.vehicles.map((v) => v.pickSphere))
        if (intersects.length < 1) intersects = raycaster.intersectObjects(GameState.buildings.map((b) => b.pickSphere))
        if (intersects.length < 1 && this.terrain) intersects = raycaster.intersectObjects(this.terrain.floorGroup.children)
        const selected = []
        if (intersects.length > 0) {
            const userData = intersects[0].object.userData
            if (userData && userData.hasOwnProperty('selectable')) {
                const selectable = userData['selectable']
                if (selectable) selected.push(selectable)
            }
        }
        GameState.selectEntities(selected)
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

        let entities: Selectable[] = GameState.raiders.filter((r) => frustum.containsPoint(r.getSelectionCenter()))
        entities.push(...(GameState.vehicles.filter((v) => frustum.containsPoint(v.getSelectionCenter()))))
        if (entities.length < 1) entities = GameState.buildings.filter((b) => frustum.containsPoint(b.getSelectionCenter()))
        GameState.selectEntities(entities)
    }

    startRendering() {
        this.debugHelper.show()
        this.renderInterval = setInterval(() => { // TODO cancel interval when not in game mode
            this.animRequest = requestAnimationFrame(() => {
                this.debugHelper.renderStart()
                this.renderer.render(this.scene, this.camera)
                this.debugHelper.renderDone()
            })
        }, 1000 / this.maxFps)
    }

    stopRendering() {
        this.debugHelper.hide()
        if (this.renderInterval) {
            clearInterval(this.renderInterval)
            this.renderInterval = null
        }
        if (this.animRequest) {
            cancelAnimationFrame(this.animRequest)
            this.animRequest = null
        }
    }

}
