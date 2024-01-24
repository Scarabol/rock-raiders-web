import { MapControls } from 'three/examples/jsm/controls/MapControls'
import { Camera, MOUSE, Vector3 } from 'three'
import { DEV_MODE, KEY_PAN_SPEED, NATIVE_UPDATE_INTERVAL, USE_KEYBOARD_SHORTCUTS } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { MOUSE_BUTTON } from '../event/EventTypeEnum'
import { degToRad } from 'three/src/math/MathUtils'

export enum CameraRotation {
    NONE = -1,
    LEFT = 0,
    UP = 1,
    RIGHT = 2,
    DOWN = 3,
}

export class BirdViewControls extends MapControls {
    private lockBuild: boolean = false
    moveTarget: Vector3 = null

    constructor(camera: Camera, readonly domElement: HTMLCanvasElement) { // overwrite domElement to make addEventListener below return KeyboardEvents
        super(camera, domElement)
        this.mouseButtons = {LEFT: null, MIDDLE: MOUSE.ROTATE, RIGHT: MOUSE.PAN}
        this.listenToKeyEvents(domElement)
        this.keyPanSpeed = this.keyPanSpeed * KEY_PAN_SPEED
        if (!DEV_MODE) {
            this.minDistance = ResourceManager.configuration.main.minDist
            this.maxDistance = ResourceManager.configuration.main.maxDist
            this.minPolarAngle = Math.PI / 2 - degToRad(ResourceManager.configuration.main.maxTilt)
            this.maxPolarAngle = Math.PI / 2 - degToRad(ResourceManager.configuration.main.minTilt)
        }
        if (!USE_KEYBOARD_SHORTCUTS) this.rewriteWASDToArrowKeys()
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

    updateForceMove(elapsedMs: number) {
        if (!this.moveTarget) return
        if (this.target.distanceToSquared(this.moveTarget) < 1) {
            this.moveTarget = null
            this.enabled = !this.lockBuild
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

    unlockCamera() {
        this.enabled = !this.lockBuild
    }

    setBuildLock(locked: boolean) {
        this.lockBuild = locked
        this.enabled = !this.lockBuild && !this.moveTarget
    }
}
