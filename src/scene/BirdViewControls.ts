import { MapControls } from 'three/examples/jsm/controls/OrbitControls'
import { GameKeyboardEvent } from '../event/GameKeyboardEvent'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { GameWheelEvent } from '../event/GameWheelEvent'
import { Camera, MOUSE } from 'three'
import { DEV_MODE, KEY_PAN_SPEED } from '../params'
import { ResourceManager } from '../resource/ResourceManager'

export class BirdViewControls extends MapControls {

    // TODO implement custom camera controls, which support direct control and especially for rotation

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

    rotate(rotationIndex: number) {
        console.log(`TODO implement rotate camera: ${['left', 'up', 'right', 'down'][rotationIndex]}`)
        // rotation can not be implemented with events, because valid pointer id is required by MapControls/OrbitControls
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
