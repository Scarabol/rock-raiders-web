import { MOUSE_BUTTON, POINTER_EVENT } from './EventTypeEnum'

export class GamePointerEvent implements PointerEventInit {
    pointerId: number | undefined
    type: string
    eventEnum: POINTER_EVENT
    bubbles: boolean
    clientX: number
    clientY: number
    pointerType: string
    button: MOUSE_BUTTON
    ctrlKey: boolean
    metaKey: boolean
    shiftKey: boolean
    canvasX: number = 0
    canvasY: number = 0

    constructor(eventEnum: POINTER_EVENT, event: PointerEvent) {
        this.pointerId = event.pointerId
        this.type = event.type
        this.eventEnum = eventEnum
        this.bubbles = false // disable bubbling otherwise we'll trigger this same event handler again
        // all event attributes used by three.js controls: clientX, clientY, deltaY, keyCode, touches, pointerType, button, ctrlKey, metaKey, shiftKey
        this.clientX = event.clientX
        this.clientY = event.clientY
        this.pointerType = event.pointerType
        this.button = event.button
        this.ctrlKey = event.ctrlKey
        this.metaKey = event.metaKey
        this.shiftKey = event.shiftKey
    }
}
