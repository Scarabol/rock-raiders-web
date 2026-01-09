import { getSpriteContext, SpriteContext, SpriteImage } from '../core/Sprite'
import { cancelAnimationFrameSafe } from '../core/Util'

type AnimationFrameRedrawCallback = (context: SpriteContext) => void

export class AnimationFrame {
    readonly context: SpriteContext
    protected lastAnimationRequest: number | undefined
    protected onRedrawCallback?: AnimationFrameRedrawCallback
    scaleX: number = 1
    scaleY: number = 1

    constructor(canvas: SpriteImage) {
        this.context = getSpriteContext(canvas)
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
        })
    }

    protected static clearAndRedrawContext(onRedraw: AnimationFrameRedrawCallback, context: SpriteContext): void {
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
    }
}
