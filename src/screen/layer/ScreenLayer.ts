import { NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../../params'
import { AnimationFrame } from '../AnimationFrame'
import { ScreenMaster } from '../ScreenMaster'

export class ScreenLayer {
    readonly eventListener: Set<string> = new Set()
    screenMaster: ScreenMaster
    canvas: HTMLCanvasElement
    readbackCanvas: HTMLCanvasElement
    zIndex: number = 0
    active: boolean = false

    constructor(layerName?: string) {
        this.canvas = this.createCanvas(layerName || this.constructor.name)
        this.readbackCanvas = this.createCanvas(`${layerName || this.constructor.name}-fastread`)
    }

    createCanvas(layerName: string): HTMLCanvasElement {
        const canvas = document.createElement('canvas')
        canvas.setAttribute('data-layer-class', layerName)
        canvas.style.visibility = 'hidden'
        return canvas
    }

    addEventListener<K extends keyof HTMLElementEventMap>(eventType: K, listener: (event: HTMLElementEventMap[K]) => boolean) {
        this.eventListener.add(eventType)
        this.canvas.addEventListener(eventType, (event) => {
            event.stopPropagation()
            const consumed = listener(event)
            if (!consumed) this.screenMaster.dispatchEvent(event, this.zIndex)
            if (eventType === 'mousemove') this.screenMaster.onGlobalMouseMoveEvent(event as PointerEvent)
            else if (eventType === 'mouseleave') this.screenMaster.onGlobalMouseLeaveEvent(event as PointerEvent)
        })
    }

    reset() {
    }

    setZIndex(zIndex: number) {
        this.zIndex = zIndex
        this.canvas.style.zIndex = String(zIndex)
        this.canvas.tabIndex = zIndex // enable keyboard input for canvas element
    }

    resize(width: number, height: number) {
        this.canvas.width = width
        this.canvas.height = height
        this.readbackCanvas.width = this.canvas.width
        this.readbackCanvas.height = this.canvas.height
    }

    show() {
        this.active = true
        this.canvas.style.visibility = 'visible'
    }

    hide() {
        this.active = false
        this.canvas.style.visibility = 'hidden'
    }

    isActive() {
        return this.active
    }

    transformCoords(clientX: number, clientY: number) {
        const clientRect = this.canvas.getBoundingClientRect()
        return [clientX - clientRect.left, clientY - clientRect.top]
    }

    takeScreenshotFromLayer(): Promise<HTMLCanvasElement> {
        return Promise.resolve(this.canvas)
    }
}

export class ScaledLayer extends ScreenLayer {
    readonly animationFrame: AnimationFrame
    fixedWidth: number = NATIVE_SCREEN_WIDTH
    fixedHeight: number = NATIVE_SCREEN_HEIGHT
    scaleX: number
    scaleY: number

    constructor(layerName?: string) {
        super(layerName)
        this.updateScale()
        this.animationFrame = new AnimationFrame(this.canvas, this.readbackCanvas)
    }

    private updateScale() {
        this.scaleX = this.canvas.width / this.fixedWidth
        this.scaleY = this.canvas.height / this.fixedHeight
    }

    transformCoords(clientX: number, clientY: number) {
        const [cx, cy] = super.transformCoords(clientX, clientY)
        return [cx / this.scaleX, cy / this.scaleY].map((c) => Math.round(c))
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        this.updateScale()
        this.animationFrame.scale(this.scaleX, this.scaleY)
        this.animationFrame.notifyRedraw()
    }

    show() {
        super.show()
        this.animationFrame.notifyRedraw()
    }
}
