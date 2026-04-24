import { getSpriteContext, SpriteContext, SpriteImage } from '../core/Sprite'
import { cancelAnimationFrameSafe } from '../core/Util'
import { AnimationFrame } from './AnimationFrame'

export class AnimationFrameReadback extends AnimationFrame {
    readonly readbackContext: SpriteContext

    constructor(canvas: SpriteImage, readbackCanvas: SpriteImage) {
        super(canvas)
        this.readbackContext = getSpriteContext(readbackCanvas, { willReadFrequently: true })
    }

    override notifyRedraw() {
        const onRedraw = this.onRedrawCallback
        if (!onRedraw) return
        this.lastAnimationRequest = cancelAnimationFrameSafe(this.lastAnimationRequest)
        this.lastAnimationRequest = requestAnimationFrame(() => {
            AnimationFrameReadback.clearAndRedrawContext(onRedraw, this.context)
            AnimationFrameReadback.clearAndRedrawContext(onRedraw, this.readbackContext)
        })
    }

    override scale(scaleX: number, scaleY: number) {
        super.scale(scaleX, scaleY)
        this.readbackContext.scale(this.scaleX, this.scaleY)
    }

    isOpaque(canvasX: number, canvasY: number): boolean {
        return this.readbackContext.getImageData(canvasX * this.scaleX, canvasY * this.scaleY, 1, 1).data[3] > 0
    }
}
