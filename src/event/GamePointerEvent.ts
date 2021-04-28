import { POINTER_EVENT } from './EventTypeEnum'

export class GamePointerEvent implements PointerEventInit {

    type: string
    eventEnum: POINTER_EVENT
    bubbles: boolean
    clientX: number
    clientY: number
    pointerType: string
    button: number
    ctrlKey: boolean
    metaKey: boolean
    shiftKey: boolean

    constructor(eventEnum: POINTER_EVENT, event: PointerEvent) {
        this.eventEnum = eventEnum
        this.type = event.type
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
