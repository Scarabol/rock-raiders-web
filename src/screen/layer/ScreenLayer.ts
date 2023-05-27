import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { GameWheelEvent } from '../../event/GameWheelEvent'
import { NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../../params'
import { AnimationFrameScaled } from '../AnimationFrame'

export class ScreenLayer {
    canvas: HTMLCanvasElement
    zIndex: number = 0
    active: boolean = true

    constructor() {
        this.canvas = document.createElement('canvas')
        this.canvas.setAttribute('data-layer-class', this.constructor.name)
        this.hide()
    }

    reset() {
    }

    setZIndex(zIndex: number) {
        this.zIndex = zIndex
        this.canvas.style.zIndex = String(zIndex)
    }

    resize(width: number, height: number) {
        this.canvas.width = width
        this.canvas.height = height
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

    pushPointerEvent(event: GamePointerEvent): Promise<boolean> {
        [event.canvasX, event.canvasY] = this.transformCoords(event.clientX, event.clientY)
        const eventConsumed = this.handlePointerEvent(event)
        return new Promise((resolve) => resolve(eventConsumed))
    }

    protected transformCoords(clientX: number, clientY: number) {
        const clientRect = this.canvas.getBoundingClientRect()
        return [clientX - clientRect.left, clientY - clientRect.top]
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
        [event.canvasX, event.canvasY] = this.transformCoords(event.clientX, event.clientY)
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
    readonly animationFrame: AnimationFrameScaled
    fixedWidth: number = NATIVE_SCREEN_WIDTH
    fixedHeight: number = NATIVE_SCREEN_HEIGHT
    scaleX: number
    scaleY: number

    constructor() {
        super()
        this.updateScale()
        this.animationFrame = new AnimationFrameScaled(this.canvas)
    }

    private updateScale() {
        this.scaleX = this.canvas.width / this.fixedWidth
        this.scaleY = this.canvas.height / this.fixedHeight
    }

    pushPointerEvent(event: GamePointerEvent): Promise<boolean> {
        [event.canvasX, event.canvasY] = this.transformCoords(event.clientX, event.clientY)
        const eventConsumed = this.handlePointerEvent(event)
        return new Promise((resolve) => resolve(eventConsumed))
    }

    protected transformCoords(clientX: number, clientY: number) {
        const [cx, cy] = super.transformCoords(clientX, clientY)
        return [cx / this.scaleX, cy / this.scaleY].map((c) => Math.round(c))
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        this.updateScale()
        this.animationFrame.scale(this.scaleX, this.scaleY)
        this.animationFrame.redraw()
    }

    show() {
        super.show()
        this.animationFrame.redraw()
    }
}
