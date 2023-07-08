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
        this.deltaX = GameWheelEvent.deltaToPixels(event.deltaX, event.deltaMode)
        this.deltaY = GameWheelEvent.deltaToPixels(event.deltaY, event.deltaMode)
        this.deltaZ = GameWheelEvent.deltaToPixels(event.deltaZ, event.deltaMode)
        this.button = event.button
        this.ctrlKey = event.ctrlKey
        this.metaKey = event.metaKey
        this.shiftKey = event.shiftKey
    }

    static deltaToPixels(delta: number, mode: number): number {
        switch (mode) {
            case WheelEvent.DOM_DELTA_PAGE:
                return delta * 100
            case WheelEvent.DOM_DELTA_LINE:
                return delta * 20
            case WheelEvent.DOM_DELTA_PIXEL:
                return delta
            default:
                console.warn(`Unexpected delta mode for wheel event ${mode}. Assuming delta given in pixels`)
                return delta
        }
    }
}
