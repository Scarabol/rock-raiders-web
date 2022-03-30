import { MapControls } from 'three/examples/jsm/controls/OrbitControls'
import { GameKeyboardEvent } from '../event/GameKeyboardEvent'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { GameWheelEvent } from '../event/GameWheelEvent'

export class CustomCameraControls extends MapControls {

    // TODO implement custom camera controls, which support direct control and especially for rotation

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
