export class GameWheelEvent {

    type: string
    bubbles: boolean
    clientX: number
    clientY: number
    deltaX: number
    deltaY: number
    deltaZ: number
    button: number
    ctrlKey: boolean
    metaKey: boolean
    shiftKey: boolean
    canvasX: number
    canvasY: number

    constructor(event: WheelEvent) {
        this.type = event.type
        this.bubbles = false // disable bubbling otherwise we'll trigger this same event handler again
        // all event attributes used by three.js controls: clientX, clientY, deltaY, keyCode, touches, button, ctrlKey, metaKey, shiftKey
        this.clientX = event.clientX
        this.clientY = event.clientY
        this.deltaX = event.deltaX
        this.deltaY = event.deltaY
        this.deltaZ = event.deltaZ
        this.button = event.button
        this.ctrlKey = event.ctrlKey
        this.metaKey = event.metaKey
        this.shiftKey = event.shiftKey
    }

}
