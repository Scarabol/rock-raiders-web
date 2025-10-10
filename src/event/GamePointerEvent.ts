import { MOUSE_BUTTON, MouseButtonType, PointerEventType } from './EventTypeEnum'

export class GamePointerEvent implements PointerEventInit {
    pointerId: number | undefined
    type: string
    eventEnum: PointerEventType
    bubbles: boolean
    clientX: number
    clientY: number
    pointerType: '' | 'mouse' | 'pen' | 'touch'
    button: MouseButtonType
    ctrlKey: boolean
    metaKey: boolean
    shiftKey: boolean
    canvasX: number = 0
    canvasY: number = 0

    constructor(eventEnum: PointerEventType, event: PointerEvent) {
        this.pointerId = event.pointerId
        this.type = event.type
        this.eventEnum = eventEnum
        this.bubbles = false // disable bubbling otherwise we'll trigger this same event handler again
        // all event attributes used by three.js controls: clientX, clientY, deltaY, keyCode, touches, pointerType, button, ctrlKey, metaKey, shiftKey
        this.clientX = event.clientX
        this.clientY = event.clientY
        this.pointerType = GamePointerEvent.toPointerType(event.pointerType)
        this.button = GamePointerEvent.toMouseButton(event.button)
        this.ctrlKey = event.ctrlKey
        this.metaKey = event.metaKey
        this.shiftKey = event.shiftKey
    }

    private static toPointerType(pointerType: string | undefined): '' | 'mouse' | 'pen' | 'touch' {
        if (!pointerType) return ''
        const lPointerType = pointerType.toLowerCase()
        if (lPointerType === 'touch') {
            return 'touch'
        } else if (lPointerType === 'pen') {
            return 'pen'
        } else {
            return 'mouse'
        }
    }

    private static toMouseButton(button: number): MouseButtonType {
        switch (button) {
            case -1:
                return MOUSE_BUTTON.none
            case 0:
                return MOUSE_BUTTON.main
            case 1:
                return MOUSE_BUTTON.middle
            case 2:
                return MOUSE_BUTTON.secondary
            default:
                console.warn(`Unexpected mouse button (${button}) given. Using fallback to ${MOUSE_BUTTON.main}`)
                return MOUSE_BUTTON.main
        }
    }
}
