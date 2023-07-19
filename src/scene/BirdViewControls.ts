import { MapControls } from 'three/examples/jsm/controls/MapControls'
import { MOUSE, Raycaster, Vector2, Vector3 } from 'three'
import { DEV_MODE, KEY_PAN_SPEED, MIN_CAMERA_HEIGHT_ABOVE_TERRAIN, NATIVE_UPDATE_INTERVAL } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { MOUSE_BUTTON } from '../event/EventTypeEnum'
import { SceneManager } from '../game/SceneManager'
import { degToRad } from 'three/src/math/MathUtils'

export enum CameraRotation {
    NONE = -1,
    LEFT = 0,
    UP = 1,
    RIGHT = 2,
    DOWN = 3,
}

export class BirdViewControls extends MapControls {
    static readonly VEC_DOWN: Vector3 = new Vector3(0, -1, 0)
    readonly lastCameraWorldPos: Vector3 = new Vector3()
    readonly raycaster: Raycaster = new Raycaster()
    moveTarget: Vector3 = null

    constructor(sceneMgr: SceneManager) {
        super(sceneMgr.camera, sceneMgr.renderer.domElement)
        this.mouseButtons = {LEFT: null, MIDDLE: MOUSE.ROTATE, RIGHT: MOUSE.PAN}
        this.listenToKeyEvents(sceneMgr.renderer.domElement)
        this.keyPanSpeed = this.keyPanSpeed * KEY_PAN_SPEED
        if (!DEV_MODE) {
            this.addEventListener('change', () => this.forceCameraAboveTerrain(sceneMgr))
            this.minDistance = ResourceManager.configuration.main.minDist
            this.maxDistance = ResourceManager.configuration.main.maxDist
            this.minPolarAngle = Math.PI / 2 - degToRad(ResourceManager.configuration.main.maxTilt)
            this.maxPolarAngle = Math.PI / 2 - degToRad(ResourceManager.configuration.main.minTilt)
        }
        this.rewriteWASDToArrowKeys() // TODO WASD also used as keyboard shortcuts for icon panels
    }

    private rewriteWASDToArrowKeys() {
        [['KeyW', 'ArrowUp'], ['KeyA', 'ArrowLeft'], ['KeyS', 'ArrowDown'], ['KeyD', 'ArrowRight']].forEach((pair) => {
            this.domElement.addEventListener('keydown', (event: KeyboardEvent) => {
                if (event.code === pair[0]) {
                    this.domElement.dispatchEvent(new KeyboardEvent(event.type, {...event, code: pair[1], key: pair[1]}))
                }
            })
            this.domElement.addEventListener('keyup', (event: KeyboardEvent) => {
                if (event.code === pair[0]) {
                    this.domElement.dispatchEvent(new KeyboardEvent(event.type, {...event, code: pair[1], key: pair[1]}))
                }
            })
        })
    }

    zoom(zoom: number) {
        this.domElement.dispatchEvent(new WheelEvent('wheel', {deltaY: 5 * zoom}))
    }

    rotate(rotationIndex: CameraRotation) {
        if (rotationIndex === CameraRotation.NONE) return
        const dx = rotationIndex === CameraRotation.LEFT ? 1 : (rotationIndex === CameraRotation.RIGHT ? -1 : 0)
        const dy = rotationIndex === CameraRotation.UP ? 1 : (rotationIndex === CameraRotation.DOWN ? -1 : 0)
        const px = (this.domElement as HTMLElement).clientWidth / 2
        const py = (this.domElement as HTMLElement).clientHeight / 2
        const step = py / 8 // => 16 clicks for a 360 no-scope
        this.domElement.dispatchEvent(new PointerEvent('pointerdown', {pointerId: 1, button: MOUSE_BUTTON.MIDDLE, clientX: px, clientY: py}))
        this.domElement.dispatchEvent(new PointerEvent('pointermove', {pointerId: 1, clientX: px + dx * step, clientY: py + dy * step}))
        this.domElement.dispatchEvent(new PointerEvent('pointerup', {pointerId: 1, button: MOUSE_BUTTON.MIDDLE, clientX: px + dx * step, clientY: py + dy * step}))
    }

    jumpTo(location: { x: number, y: number, z: number }) {
        const offsetTargetToCamera = this.object.position.clone().sub(this.target)
        this.object.position.set(location.x, location.y, location.z).add(offsetTargetToCamera)
        this.target.set(location.x, location.y, location.z)
        this.update()
    }

    private forceCameraAboveTerrain(sceneMgr: SceneManager) {
        this.object.getWorldPosition(this.lastCameraWorldPos)
        this.raycaster.set(this.lastCameraWorldPos, BirdViewControls.VEC_DOWN)
        const terrainIntersectionPoint = this.raycaster.intersectObject(sceneMgr.terrain.floorGroup, true)?.[0]?.point
        if (!terrainIntersectionPoint) return
        const minCameraPosY = terrainIntersectionPoint.y + MIN_CAMERA_HEIGHT_ABOVE_TERRAIN
        const centerPosition = this.target.clone()
        centerPosition.y = 0
        const groundPosition = this.object.position.clone()
        groundPosition.y = 0
        const origin = new Vector2(this.target.y, 0)
        const remote = new Vector2(minCameraPosY, centerPosition.distanceTo(groundPosition))
        this.maxPolarAngle = Math.atan2(remote.y - origin.y, remote.x - origin.x)
    }

    updateForceMove(elapsedMs: number) {
        if (!this.moveTarget) return
        if (this.target.distanceToSquared(this.moveTarget) < 1) {
            this.moveTarget = null
            this.enabled = true
        } else {
            const nextCameraTargetPos = this.target.clone().add(this.moveTarget.clone().sub(this.target)
                .clampLength(0, ResourceManager.configuration.main.CameraSpeed * elapsedMs / NATIVE_UPDATE_INTERVAL))
            this.jumpTo(nextCameraTargetPos)
        }
    }

    forceMoveToTarget(target: Vector3) {
        this.enabled = false
        this.moveTarget = target
    }
}
