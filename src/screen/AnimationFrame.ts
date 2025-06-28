import { getSpriteContext, SpriteContext, SpriteImage } from '../core/Sprite'
import { cancelAnimationFrameSafe } from '../core/Util'

type AnimationFrameRedrawCallback = (context: SpriteContext) => void

export class AnimationFrame {
    readonly context: SpriteContext
    readonly readbackContext: SpriteContext
    private lastAnimationRequest?: number
    private onRedrawCallback?: AnimationFrameRedrawCallback
    scaleX: number = 1
    scaleY: number = 1

    constructor(canvas: SpriteImage, readbackCanvas: SpriteImage) {
        this.context = getSpriteContext(canvas)
        this.readbackContext = getSpriteContext(readbackCanvas, {willReadFrequently: true})
    }

    set onRedraw(callback: AnimationFrameRedrawCallback) {
        this.onRedrawCallback = callback
    }

    notifyRedraw() {
        const onRedraw = this.onRedrawCallback
        if (!onRedraw) return
        this.lastAnimationRequest = cancelAnimationFrameSafe(this.lastAnimationRequest)
        this.lastAnimationRequest = requestAnimationFrame(() => {
            AnimationFrame.clearAndRedrawContext(onRedraw, this.context)
            AnimationFrame.clearAndRedrawContext(onRedraw, this.readbackContext)
        })
    }

    private static clearAndRedrawContext(onRedraw: AnimationFrameRedrawCallback, context: SpriteContext): void {
        context.save()
        context.setTransform(1, 0, 0, 1, 0, 0)
        context.clearRect(0, 0, context.canvas.width, context.canvas.height)
        context.restore()
        onRedraw(context)
    }

    scale(scaleX: number, scaleY: number) {
        this.scaleX = scaleX
        this.scaleY = scaleY
        this.context.scale(this.scaleX, this.scaleY)
        this.readbackContext.scale(this.scaleX, this.scaleY)
    }

    isOpaque(canvasX: number, canvasY: number): boolean {
        return this.readbackContext.getImageData(canvasX * this.scaleX, canvasY * this.scaleY, 1, 1).data[3] > 0
    }
}
