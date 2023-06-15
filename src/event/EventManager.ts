import { ScreenLayer } from '../screen/layer/ScreenLayer'
import { ScreenMaster } from '../screen/ScreenMaster'
import { KEY_EVENT, POINTER_EVENT } from './EventTypeEnum'
import { GameKeyboardEvent } from './GameKeyboardEvent'
import { GamePointerEvent } from './GamePointerEvent'
import { GameWheelEvent } from './GameWheelEvent'

export class EventManager {
    focusedLayer: ScreenLayer = null // TODO Use web API setPointerCapture instead

    constructor(screenMaster: ScreenMaster) {
        screenMaster.gameCanvasContainer.addEventListener('contextmenu', (event: MouseEvent) => event.preventDefault())
        screenMaster.gameCanvasContainer.addEventListener('pointerdown', () => screenMaster.gameCanvasContainer.focus())
        new Map<keyof HTMLElementEventMap, POINTER_EVENT>([
            ['pointermove', POINTER_EVENT.MOVE],
            ['pointerdown', POINTER_EVENT.DOWN],
            ['pointerup', POINTER_EVENT.UP],
            ['pointerleave', POINTER_EVENT.LEAVE],
        ]).forEach((eventEnum, eventType) => {
            screenMaster.gameCanvasContainer.addEventListener(eventType, (event: PointerEvent) => {
                event.preventDefault()
                this.publishPointerEvent(this.getActiveLayersSorted(screenMaster), new GamePointerEvent(eventEnum, event))
                if (eventEnum === POINTER_EVENT.UP || eventEnum === POINTER_EVENT.LEAVE) {
                    if (eventEnum === POINTER_EVENT.UP && !this.focusedLayer) console.warn('Input lag detected') // TODO Fix "up" event being processed before "down" event is complete
                    this.focusedLayer = null
                }
            })
        })
        new Map<keyof HTMLElementEventMap, KEY_EVENT>([
            ['keydown', KEY_EVENT.DOWN],
            ['keyup', KEY_EVENT.UP],
        ]).forEach((eventEnum, eventType) => {
            screenMaster.gameCanvasContainer.addEventListener(eventType, (event: KeyboardEvent) => {
                this.publishKeyEvent(this.getActiveLayersSorted(screenMaster), new GameKeyboardEvent(eventEnum, event))
            })
        })
        screenMaster.gameCanvasContainer.addEventListener('wheel', (event: WheelEvent) => {
            this.publishWheelEvent(this.getActiveLayersSorted(screenMaster), new GameWheelEvent(event))
        })
    }

    private getActiveLayersSorted(screenMaster: ScreenMaster) {
        if (this.focusedLayer) return [this.focusedLayer]
        return screenMaster.getActiveLayersSorted()
    }

    private publishPointerEvent(activeLayers: ScreenLayer[], event: GamePointerEvent) {
        const currentLayer = activeLayers.shift()
        if (!currentLayer) return
        [event.canvasX, event.canvasY] = currentLayer.transformCoords(event.clientX, event.clientY)
        const consumed = currentLayer.handlePointerEvent(event)
        if (!consumed) this.publishPointerEvent(activeLayers, event)
        else if (event.eventEnum === POINTER_EVENT.DOWN) this.focusedLayer = currentLayer
    }

    private publishKeyEvent(activeLayers: ScreenLayer[], event: GameKeyboardEvent) {
        const currentLayer = activeLayers.shift()
        if (!currentLayer) return
        const consumed = currentLayer.handleKeyEvent(event)
        if (!consumed) this.publishKeyEvent(activeLayers, event)
    }

    private publishWheelEvent(activeLayers: ScreenLayer[], event: GameWheelEvent) {
        const currentLayer = activeLayers.shift()
        if (!currentLayer) return
        [event.canvasX, event.canvasY] = currentLayer.transformCoords(event.clientX, event.clientY)
        const consumed = currentLayer.handleWheelEvent(event)
        if (!consumed) this.publishWheelEvent(activeLayers, event)
    }
}
