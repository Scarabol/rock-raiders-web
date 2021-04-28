import { DEV_MODE } from '../params'
import { BaseScreen } from '../screen/BaseScreen'
import { ScreenLayer } from '../screen/layer/ScreenLayer'
import { KEY_EVENT, POINTER_EVENT } from './EventTypeEnum'
import { GameKeyboardEvent } from './GameKeyboardEvent'
import { GamePointerEvent } from './GamePointerEvent'
import { GameWheelEvent } from './GameWheelEvent'

export class EventManager {

    constructor(screen: BaseScreen) {
        screen.gameCanvasContainer.addEventListener('contextmenu', (event: MouseEvent) => {
            if (screen.isInRect(event)) event.preventDefault()
        })
        new Map<string, POINTER_EVENT>([
            ['pointermove', POINTER_EVENT.MOVE],
            ['pointerdown', POINTER_EVENT.DOWN],
            ['pointerup', POINTER_EVENT.UP],
        ]).forEach((eventEnum, eventType) => {
            screen.gameCanvasContainer.addEventListener(eventType, (event: PointerEvent) => {
                if (!screen.isInRect(event)) return
                event.preventDefault()
                const nonBubblingClone = new GamePointerEvent(eventEnum, event)
                screen.layers.filter(l => l.isActive())
                    .sort((a, b) => ScreenLayer.compareZ(a, b))
                    .some(l => l.handlePointerEvent(nonBubblingClone))
            })
        })
        new Map<string, KEY_EVENT>([
            ['keydown', KEY_EVENT.DOWN],
            ['keyup', KEY_EVENT.UP],
        ]).forEach((eventEnum, eventType) => {
            screen.gameCanvasContainer.addEventListener(eventType, (event: KeyboardEvent) => {
                if (!DEV_MODE) event.preventDefault()
                const nonBubblingClone = new GameKeyboardEvent(eventEnum, event)
                screen.layers.filter(l => l.isActive())
                    .sort((a, b) => ScreenLayer.compareZ(a, b))
                    .some(l => l.handleKeyEvent(nonBubblingClone))
            })
        })
        screen.gameCanvasContainer.addEventListener('wheel', (event: WheelEvent) => {
            if (!screen.isInRect(event)) return
            const nonBubblingClone = new GameWheelEvent(event)
            screen.layers.filter(l => l.isActive())
                .sort((a, b) => ScreenLayer.compareZ(a, b))
                .some(l => l.handleWheelEvent(nonBubblingClone))
        })
    }

}
