import { cancelAnimationFrameSafe } from '../../core/Util'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { GameWheelEvent } from '../../event/GameWheelEvent'
import { NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../../params'

export class ScreenLayer {
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
    onRedraw: (context: SpriteContext) => any
    active: boolean = true
    lastAnimationRequest: number = null

    constructor(alpha: boolean, withContext: boolean) {
        this.initCanvas()
        if (!alpha) this.canvas.style.background = '#f0f'
        if (withContext) this.context = this.canvas.getContext('2d', {alpha: alpha})
        this.hide()
    }

    protected initCanvas() {
        this.canvas = document.createElement('canvas')
        this.canvas.setAttribute('data-layer-class', this.constructor.name)
    }

    reset() {
    }

    setZIndex(zIndex: number) {
        this.canvas.style.zIndex = String(zIndex)
    }

    static compareZ(layerA: ScreenLayer, layerB: ScreenLayer) {
        let aIndex = layerA?.canvas?.style?.zIndex || 0
        const bIndex = layerB?.canvas?.style?.zIndex || 0
        return aIndex === bIndex ? 0 : aIndex > bIndex ? -1 : 1
    }

    resize(width: number, height: number) {
        this.canvas.width = width
        this.canvas.height = height
    }

    redraw() {
        if (this.onRedraw && this.isActive()) {
            cancelAnimationFrameSafe(this.lastAnimationRequest)
            this.lastAnimationRequest = requestAnimationFrame(this.doRedraw.bind(this))
        }
    }

    doRedraw() {
        this.onRedraw(this.context)
    }

    show() {
        this.active = true
        this.canvas.style.visibility = 'visible'
        this.redraw()
    }

    hide() {
        this.active = false
        this.canvas.style.visibility = 'hidden'
    }

    isActive() {
        return this.active
    }

    toCanvasCoords(windowX: number, windowY: number) {
        const clientRect = this.canvas.getBoundingClientRect()
        return [windowX - clientRect.left, windowY - clientRect.top]
    }

    pushPointerEvent(event: GamePointerEvent): Promise<boolean> {
        const eventConsumed = this.handlePointerEvent(event)
        return new Promise((resolve) => resolve(eventConsumed))
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        return false
    }

    pushKeyEvent(event: GameKeyboardEvent): Promise<boolean> {
        const eventConsumed = this.handleKeyEvent(event)
        return new Promise((resolve) => resolve(eventConsumed))
    }

    handleKeyEvent(event: GameKeyboardEvent): boolean {
        return false
    }

    pushWheelEvent(event: GameWheelEvent): Promise<boolean> {
        const eventConsumed = this.handleWheelEvent(event)
        return new Promise((resolve) => resolve(eventConsumed))
    }

    handleWheelEvent(event: GameWheelEvent): boolean {
        return false
    }

    takeScreenshotFromLayer(): Promise<HTMLCanvasElement> {
        return new Promise<HTMLCanvasElement>((resolve) => resolve(this.canvas))
    }
}

export class ScaledLayer extends ScreenLayer {
    fixedWidth: number = NATIVE_SCREEN_WIDTH
    fixedHeight: number = NATIVE_SCREEN_HEIGHT
    scaleX: number
    scaleY: number

    constructor(alpha: boolean = true, withContext: boolean = true) {
        super(alpha, withContext)
        this.updateScale()
    }

    private updateScale() {
        this.scaleX = this.canvas.width / this.fixedWidth
        this.scaleY = this.canvas.height / this.fixedHeight
    }

    toScaledCoords(windowX: number, windowY: number) {
        const [cx, cy] = this.toCanvasCoords(windowX, windowY)
        return [cx / this.scaleX, cy / this.scaleY].map((c) => Math.round(c))
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        this.updateScale()
        this.context.scale(this.scaleX, this.scaleY)
    }
}
