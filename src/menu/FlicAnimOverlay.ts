import { SpriteContext, SpriteImage } from '../core/Sprite'
import { NATIVE_UPDATE_INTERVAL } from '../params'
import { clearTimeoutSafe } from '../core/Util'
import { AnimationFrame } from '../screen/AnimationFrame'
import { SoundManager } from '../audio/SoundManager'

export class FlicAnimOverlay {
    hidden: boolean = true
    animIndex: number = 0
    timeout?: NodeJS.Timeout
    sfx?: AudioBufferSourceNode

    constructor(
        readonly animationFrame: AnimationFrame,
        readonly flicImages: SpriteImage[],
        readonly x: number,
        readonly y: number,
        readonly sfxName: string,
    ) {
    }

    play(): Promise<void> {
        this.stop()
        return new Promise((resolve) => {
            this.animIndex = 0
            if (this.sfxName) this.sfx = SoundManager.playSound(this.sfxName, false)
            this.trigger(resolve)
        })
    }

    private trigger(resolve: (value: (PromiseLike<void> | void)) => void) {
        if (this.animIndex < this.flicImages.length - 1) {
            this.hidden = false
            this.timeout = clearTimeoutSafe(this.timeout)
            this.timeout = setTimeout(() => {
                this.animIndex++
                this.trigger(resolve)
            }, NATIVE_UPDATE_INTERVAL)
            this.animationFrame.notifyRedraw()
        } else {
            this.stop()
            resolve()
        }
    }

    draw(context: SpriteContext) {
        if (this.hidden) return
        const img = this.flicImages[this.animIndex]
        if (img) context.drawImage(img, this.x, this.y)
    }

    stop() {
        this.hidden = true
        this.animIndex = 0
        this.timeout = clearTimeoutSafe(this.timeout)
        this.sfx?.stop()
        this.sfx = undefined
    }
}
