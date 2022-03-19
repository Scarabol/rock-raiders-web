import { DEV_MODE } from '../params'
import { ScreenMaster } from '../screen/ScreenMaster'
import { ScreenLayer } from '../screen/layer/ScreenLayer'
import { KEY_EVENT, POINTER_EVENT } from './EventTypeEnum'
import { GameKeyboardEvent } from './GameKeyboardEvent'
import { GamePointerEvent } from './GamePointerEvent'
import { GameWheelEvent } from './GameWheelEvent'

export class EventManager {
    constructor(screenMaster: ScreenMaster) {
        screenMaster.gameCanvasContainer.addEventListener('contextmenu', (event: MouseEvent) => event.preventDefault())
        new Map<string, POINTER_EVENT>([
            ['pointermove', POINTER_EVENT.MOVE],
            ['pointerdown', POINTER_EVENT.DOWN],
            ['pointerup', POINTER_EVENT.UP],
        ]).forEach((eventEnum, eventType) => {
            screenMaster.gameCanvasContainer.addEventListener(eventType, (event: PointerEvent) => {
                event.preventDefault()
                EventManager.publishPointerEvent(screenMaster.getActiveLayersSorted(), new GamePointerEvent(eventEnum, event))
            })
        })
        new Map<string, KEY_EVENT>([
            ['keydown', KEY_EVENT.DOWN],
            ['keyup', KEY_EVENT.UP],
        ]).forEach((eventEnum, eventType) => {
            screenMaster.gameCanvasContainer.addEventListener(eventType, (event: KeyboardEvent) => {
                if (!DEV_MODE) event.preventDefault()
                EventManager.publishKeyEvent(screenMaster.getActiveLayersSorted(), new GameKeyboardEvent(eventEnum, event))
            })
        })
        screenMaster.gameCanvasContainer.addEventListener('wheel', (event: WheelEvent) => {
            EventManager.publishWheelEvent(screenMaster.getActiveLayersSorted(), new GameWheelEvent(event))
        })
    }

    private static publishPointerEvent(activeLayers: ScreenLayer[], event: GamePointerEvent) {
        activeLayers.shift()?.handlePointerEvent(event).then((consumed) => {
            if (!consumed) this.publishPointerEvent(activeLayers, event)
        })
    }

    private static publishKeyEvent(activeLayers: ScreenLayer[], event: GameKeyboardEvent) {
        activeLayers.shift()?.handleKeyEvent(event).then((consumed) => {
            if (!consumed) this.publishKeyEvent(activeLayers, event)
        })
    }

    private static publishWheelEvent(activeLayers: ScreenLayer[], event: GameWheelEvent) {
        activeLayers.shift()?.handleWheelEvent(event).then((consumed) => {
            if (!consumed) this.publishWheelEvent(activeLayers, event)
        })
    }
}
