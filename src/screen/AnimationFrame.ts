import { SpriteContext } from '../core/Sprite'

type AnimationFrameRedrawCallback = (context: SpriteContext) => any

export class AnimationFrame {
    readonly context: SpriteContext = null
    readonly readbackContext: SpriteContext = null
    private lastAnimationRequest: number = null
    private redrawCallback: AnimationFrameRedrawCallback = null

    constructor(canvas: HTMLCanvasElement | OffscreenCanvas, readbackCanvas: HTMLCanvasElement | OffscreenCanvas) {
        this.context = canvas.getContext('2d') as SpriteContext
        this.readbackContext = readbackCanvas.getContext('2d', {willReadFrequently: true}) as SpriteContext
    }

    set onRedraw(callback: AnimationFrameRedrawCallback) {
        this.redrawCallback = callback
    }

    notifyRedraw() {
        const callback = this.redrawCallback
        if (!callback) return
        if (this.lastAnimationRequest) cancelAnimationFrame(this.lastAnimationRequest)
        this.lastAnimationRequest = requestAnimationFrame(() => {
            callback(this.context)
            callback(this.readbackContext)
        })
    }

    isOpaque(canvasX: number, canvasY: number): boolean {
        return this.readbackContext.getImageData(canvasX, canvasY, 1, 1).data[3] > 0
    }
}

export class AnimationFrameScaled extends AnimationFrame {
    scaleX: number = 1
    scaleY: number = 1

    scale(scaleX: number, scaleY: number) {
        this.scaleX = scaleX
        this.scaleY = scaleY
        this.context.scale(this.scaleX, this.scaleY)
        this.readbackContext.scale(this.scaleX, this.scaleY)
    }

    isOpaque(canvasX: number, canvasY: number): boolean {
        return super.isOpaque(canvasX * this.scaleX, canvasY * this.scaleY)
    }
}
