import { SpriteContext, SpriteImage } from '../core/Sprite'
import { NATIVE_UPDATE_INTERVAL } from '../params'
import { clearTimeoutSafe } from '../core/Util'
import { AnimationFrame } from '../screen/AnimationFrame'

export class FlicAnimOverlay {
    animIndex: number = 0
    timeout: NodeJS.Timeout

    constructor(
        readonly animationFrame: AnimationFrame,
        readonly flicImages: SpriteImage[],
        readonly x: number,
        readonly y: number,
    ) {
    }

    play(): Promise<void> {
        return new Promise((resolve) => {
            this.animIndex = 0
            this.trigger(resolve)
        })
    }

    private trigger(resolve: (value: (PromiseLike<void> | void)) => void) {
        this.animationFrame.notifyRedraw()
        if (this.animIndex < this.flicImages.length - 1) {
            this.timeout = setTimeout(() => {
                this.animIndex++
                this.trigger(resolve)
            }, NATIVE_UPDATE_INTERVAL)
        } else {
            resolve()
        }
    }

    draw(context: SpriteContext) {
        const img = this.flicImages[this.animIndex]
        if (img) context.drawImage(img, this.x, this.y)
    }

    stop() {
        this.animIndex = 0
        this.timeout = clearTimeoutSafe(this.timeout)
    }
}
