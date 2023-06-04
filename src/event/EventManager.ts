import { DEV_MODE } from '../params'
import { ScreenLayer } from '../screen/layer/ScreenLayer'
import { ScreenMaster } from '../screen/ScreenMaster'
import { KEY_EVENT, POINTER_EVENT } from './EventTypeEnum'
import { GameKeyboardEvent } from './GameKeyboardEvent'
import { GamePointerEvent } from './GamePointerEvent'
import { GameWheelEvent } from './GameWheelEvent'

export class EventManager {
    constructor(readonly screenMaster: ScreenMaster) {
        screenMaster.gameCanvasContainer.addEventListener('contextmenu', (event: MouseEvent) => event.preventDefault())
        new Map<string, POINTER_EVENT>([
            ['pointermove', POINTER_EVENT.MOVE],
            ['pointerdown', POINTER_EVENT.DOWN],
            ['pointerup', POINTER_EVENT.UP],
            ['pointerleave', POINTER_EVENT.LEAVE]
        ]).forEach((eventEnum, eventType) => {
            screenMaster.gameCanvasContainer.addEventListener(eventType, (event: Event) => {
                event.preventDefault()
                this.publishPointerEvent(screenMaster.getActiveLayersSorted(), new GamePointerEvent(eventEnum, event as PointerEvent))
            })
        })
        screenMaster.gameCanvasContainer.addEventListener('pointerdown', () => screenMaster.gameCanvasContainer.focus())
        ;['pointerup', 'pointerleave'].forEach((eventType) => {
            screenMaster.gameCanvasContainer.addEventListener(eventType, () => this.screenMaster.focusedLayer = null)
        })
        new Map<string, KEY_EVENT>([
            ['keydown', KEY_EVENT.DOWN],
            ['keyup', KEY_EVENT.UP],
        ]).forEach((eventEnum, eventType) => {
            screenMaster.gameCanvasContainer.addEventListener(eventType, (event: Event) => {
                if (!DEV_MODE) event.preventDefault() // Blocks F5 page reload
                this.publishKeyEvent(screenMaster.getActiveLayersSorted(), new GameKeyboardEvent(eventEnum, event as KeyboardEvent))
            })
        })
        screenMaster.gameCanvasContainer.addEventListener('wheel', (event: WheelEvent) => {
            this.publishWheelEvent(screenMaster.getActiveLayersSorted(), new GameWheelEvent(event))
        })
    }

    private publishPointerEvent(activeLayers: ScreenLayer[], event: GamePointerEvent) {
        const currentLayer = activeLayers.shift()
        currentLayer?.pushPointerEvent(event).then((consumed) => {
            if (!consumed) this.publishPointerEvent(activeLayers, event)
            else if (event.eventEnum === POINTER_EVENT.DOWN) this.screenMaster.focusedLayer = currentLayer
        }).catch((e) => {
            console.error(e)
        })
    }

    private publishKeyEvent(activeLayers: ScreenLayer[], event: GameKeyboardEvent) {
        activeLayers.shift()?.pushKeyEvent(event).then((consumed) => {
            if (!consumed) this.publishKeyEvent(activeLayers, event)
        }).catch((e) => {
            console.error(e)
        })
    }

    private publishWheelEvent(activeLayers: ScreenLayer[], event: GameWheelEvent) {
        activeLayers.shift()?.pushWheelEvent(event).then((consumed) => {
            if (!consumed) this.publishWheelEvent(activeLayers, event)
        }).catch((e) => {
            console.error(e)
        })
    }
}
