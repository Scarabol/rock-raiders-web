import { MapControls } from 'three/examples/jsm/controls/MapControls'
import { GameKeyboardEvent } from '../event/GameKeyboardEvent'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { GameWheelEvent } from '../event/GameWheelEvent'
import { Camera, MOUSE } from 'three'
import { DEV_MODE, KEY_PAN_SPEED } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { MOUSE_BUTTON } from '../event/EventTypeEnum'

export enum CameraRotation {
    NONE = -1,
    LEFT = 0,
    UP = 1,
    RIGHT = 2,
    DOWN = 3,
}

export class BirdViewControls extends MapControls {

    constructor(camera: Camera, domElement: HTMLElement) {
        super(camera, domElement)
        this.mouseButtons = {LEFT: null, MIDDLE: MOUSE.ROTATE, RIGHT: MOUSE.PAN}
        // this.controls.maxPolarAngle = Math.PI * 0.45; // TODO dynamically adapt to terrain height at camera position
        this.listenToKeyEvents(domElement)
        this.keyPanSpeed = this.keyPanSpeed * KEY_PAN_SPEED
        if (!DEV_MODE) {
            this.minDistance = ResourceManager.configuration.main.minDist
            this.maxDistance = ResourceManager.configuration.main.maxDist
        }
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

    handlePointerEvent(event: GamePointerEvent): boolean {
        this.domElement.dispatchEvent(new PointerEvent(event.type, event))
        return true
    }

    handleKeyEvent(event: GameKeyboardEvent): boolean {
        this.domElement.dispatchEvent(new KeyboardEvent(event.type, event))
        return true
    }

    handleWheelEvent(event: GameWheelEvent): boolean {
        this.domElement.dispatchEvent(new WheelEvent(event.type, event))
        return true
    }
}
