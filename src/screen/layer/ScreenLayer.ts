import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { GameWheelEvent } from '../../event/GameWheelEvent'
import { SPRITE_RESOLUTION_HEIGHT, SPRITE_RESOLUTION_WIDTH } from '../../params'

export class ScreenLayer {

    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
    onRedraw: (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) => any
    active: boolean = true

    constructor(alpha: boolean, withContext: boolean) {
        this.canvas = document.createElement('canvas')
        if (!alpha) this.canvas.style.background = '#f0f'
        if (withContext) this.context = this.canvas.getContext('2d', {alpha: alpha})
        this.hide()
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

    resize(width, height) {
        this.canvas.width = width
        this.canvas.height = height
    }

    redraw() {
        const callback = this.onRedraw
        if (this.isActive() && callback) {
            const context = this.context
            requestAnimationFrame(() => callback(context))
        }
    }

    show() {
        this.reset()
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

    handlePointerEvent(event: GamePointerEvent): Promise<boolean> {
        return new Promise((resolve) => resolve(false))
    }

    handleKeyEvent(event: GameKeyboardEvent): Promise<boolean> {
        return new Promise((resolve) => resolve(false))
    }

    handleWheelEvent(event: GameWheelEvent): Promise<boolean> {
        return new Promise((resolve) => resolve(false))
    }

}

export class ScaledLayer extends ScreenLayer {

    fixedWidth: number = SPRITE_RESOLUTION_WIDTH
    fixedHeight: number = SPRITE_RESOLUTION_HEIGHT
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

    resize(width, height) {
        super.resize(width, height)
        this.updateScale()
        this.context.scale(this.scaleX, this.scaleY)
    }

}
