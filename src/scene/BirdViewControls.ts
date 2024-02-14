import { MapControls } from 'three/examples/jsm/controls/MapControls'
import { Camera, MOUSE, Vector3 } from 'three'
import { DEV_MODE, KEY_PAN_SPEED, NATIVE_UPDATE_INTERVAL, USE_KEYBOARD_SHORTCUTS } from '../params'
import { MOUSE_BUTTON } from '../event/EventTypeEnum'
import { degToRad } from 'three/src/math/MathUtils'
import { GameConfig } from '../cfg/GameConfig'
import { PositionComponent } from '../game/component/PositionComponent'
import { EventBroker } from '../event/EventBroker'
import { EventKey } from '../event/EventKeyEnum'

export enum CameraRotation {
    NONE = 0,
    LEFT = 1,
    UP = 2,
    RIGHT = 3,
    DOWN = 4,
}

export class BirdViewControls extends MapControls {
    private readonly dummyPointerId: number
    private lockBuild: boolean = false
    moveTarget: Vector3 = null
    lastPanKey: string = ''
    lockedObject: PositionComponent
    disabled: boolean = false
    gamePaused: boolean = false

    constructor(camera: Camera, readonly domElement: HTMLCanvasElement) { // overwrite domElement to make addEventListener below return KeyboardEvents
        super(camera, domElement)
        this.dummyPointerId = this.verifyPointerId()
        this.mouseButtons = {LEFT: null, MIDDLE: MOUSE.ROTATE, RIGHT: MOUSE.PAN}
        this.listenToKeyEvents(domElement)
        this.keyPanSpeed = this.keyPanSpeed * KEY_PAN_SPEED
        if (!DEV_MODE) {
            this.minDistance = GameConfig.instance.main.minDist
            this.maxDistance = GameConfig.instance.main.maxDist
            this.minPolarAngle = Math.PI / 2 - degToRad(GameConfig.instance.main.maxTilt)
            this.maxPolarAngle = Math.PI / 2 - degToRad(GameConfig.instance.main.minTilt)
        }
        if (!USE_KEYBOARD_SHORTCUTS) this.useWASDToPanAndArrowKeysToRotate()
        EventBroker.subscribe(EventKey.PAUSE_GAME, () => {
            this.gamePaused = true
            this.enabled = false
            this.lastPanKey = ''
        })
        EventBroker.subscribe(EventKey.UNPAUSE_GAME, () => {
            this.gamePaused = false
            this.updateEnabled()
        })
    }

    private useWASDToPanAndArrowKeysToRotate() {
        this.keys = {LEFT: 'KeyA', UP: 'KeyW', RIGHT: 'KeyD', BOTTOM: 'KeyS'}
        ;[{code: 'ArrowUp', rot: CameraRotation.UP}, {code: 'ArrowLeft', rot: CameraRotation.LEFT}, {code: 'ArrowDown', rot: CameraRotation.DOWN}, {code: 'ArrowRight', rot: CameraRotation.RIGHT}].forEach((pair) => {
            this.domElement.addEventListener('keydown', (event: KeyboardEvent) => {
                if (event.code === pair.code) this.rotate(pair.rot)
            })
        })
    }

    zoom(zoom: number) {
        if (!this.enabled) return
        this.domElement.dispatchEvent(new WheelEvent('wheel', {deltaY: 120 * zoom, deltaMode: 0}))
    }

    rotate(rotationIndex: CameraRotation) {
        if (rotationIndex === CameraRotation.NONE || !this.enabled) return
        const dx = rotationIndex === CameraRotation.LEFT ? 1 : (rotationIndex === CameraRotation.RIGHT ? -1 : 0)
        const dy = rotationIndex === CameraRotation.UP ? 1 : (rotationIndex === CameraRotation.DOWN ? -1 : 0)
        const px = (this.domElement as HTMLElement).clientWidth / 2
        const py = (this.domElement as HTMLElement).clientHeight / 2
        const step = py / 8 // => 16 clicks for a 360 no-scope
        this.domElement.dispatchEvent(new PointerEvent('pointerdown', {pointerId: this.dummyPointerId, button: MOUSE_BUTTON.MIDDLE, clientX: px, clientY: py}))
        this.domElement.dispatchEvent(new PointerEvent('pointermove', {pointerId: this.dummyPointerId, clientX: px + dx * step, clientY: py + dy * step}))
        this.domElement.dispatchEvent(new PointerEvent('pointerup', {pointerId: this.dummyPointerId, button: MOUSE_BUTTON.MIDDLE, clientX: px + dx * step, clientY: py + dy * step}))
    }

    private verifyPointerId(): number {
        try {
            // pointer id 1 should work with Chromium
            this.domElement.setPointerCapture(1)
            this.domElement.releasePointerCapture(1)
            return 1
        } catch (e1) {
            try {
                // pointer id 0 should work with Firefox
                this.domElement.setPointerCapture(0)
                this.domElement.releasePointerCapture(0)
            } catch (e2) {
                console.warn('Could not find working pointer id. Rotation might not be working', e1, e2)
            }
            return 0
        }
    }

    jumpTo(location: { x: number, y: number, z: number }) {
        const offsetTargetToCamera = this.object.position.clone().sub(this.target)
        this.object.position.set(location.x, location.y, location.z).add(offsetTargetToCamera)
        this.target.set(location.x, location.y, location.z)
        this.update()
    }

    updateControlsSafe(elapsedMs: number) {
        try {
            if (this.lockedObject) this.moveTarget = this.lockedObject.position
            if (this.moveTarget) {
                if (this.target.distanceToSquared(this.moveTarget) < 1) {
                    this.moveTarget = null
                    this.updateEnabled()
                } else {
                    const nextCameraTargetPos = this.target.clone().add(this.moveTarget.clone().sub(this.target)
                        .clampLength(0, GameConfig.instance.main.CameraSpeed * elapsedMs / NATIVE_UPDATE_INTERVAL))
                    this.jumpTo(nextCameraTargetPos)
                }
            } else {
                this.updateAutoPan() // XXX This should consider elapsed time independent for game speed
            }
        } catch (e) {
            console.error(e)
        }
    }

    forceMoveToTarget(target: Vector3) {
        this.moveTarget = target
        this.enabled = false
    }

    unlockCamera() {
        this.lockedObject = null
        this.updateEnabled()
    }

    setBuildLock(locked: boolean) {
        this.lockBuild = locked
        this.updateEnabled()
    }

    setAutoPan(key: string) {
        this.lastPanKey = key
    }

    updateAutoPan() {
        if (!this.lastPanKey) return
        const panSpeed = this.keyPanSpeed
        this.keyPanSpeed = 24
        this.domElement.dispatchEvent(new KeyboardEvent('keydown', {code: this.lastPanKey, key: this.lastPanKey}))
        this.keyPanSpeed = panSpeed
    }

    lockOnObject(position: PositionComponent) {
        this.lockedObject = position
        this.enabled = false
    }

    updateEnabled() {
        this.enabled = !this.lockBuild && !this.moveTarget && !this.lockedObject && !this.disabled && !this.gamePaused
    }
}
