import { SpriteContext } from '../core/Sprite'
import { NATIVE_UPDATE_INTERVAL } from '../params'
import { clearTimeoutSafe } from '../core/Util'
import { AnimationFrame } from '../screen/AnimationFrame'
import { SoundManager } from '../audio/SoundManager'
import { createContext } from '../core/ImageHelper'

export class FlicAnimOverlay {
    readonly context: SpriteContext | undefined
    hidden: boolean = true
    animIndex: number = 0
    timeout: NodeJS.Timeout | undefined
    sfx: AudioBufferSourceNode | undefined

    constructor(
        readonly animationFrame: AnimationFrame,
        readonly flicImages: ImageData[],
        readonly x: number,
        readonly y: number,
        readonly sfxName: string,
    ) {
        if (flicImages[0]) this.context = createContext(flicImages[0].width, flicImages[0].height)
    }

    play(): Promise<void> {
        this.stop()
        return new Promise((resolve) => {
            this.animIndex = 0
            if (this.currentImage) this.context?.putImageData(this.currentImage, 0, 0)
            if (this.sfxName) this.sfx = SoundManager.playSfxSound(this.sfxName)
            this.trigger(resolve)
        })
    }

    private trigger(resolve: (value: (PromiseLike<void> | void)) => void) {
        if (this.animIndex < this.flicImages.length - 1) {
            this.hidden = false
            this.timeout = clearTimeoutSafe(this.timeout)
            this.timeout = setTimeout(() => {
                this.animIndex++
                if (this.currentImage) this.context?.putImageData(this.currentImage, 0, 0)
                this.trigger(resolve)
            }, NATIVE_UPDATE_INTERVAL)
            this.animationFrame.notifyRedraw()
        } else {
            this.stop()
            resolve()
        }
    }

    draw(context: SpriteContext) {
        if (this.hidden || !this.currentImage || !this.context) return
        context.drawImage(this.context.canvas, this.x, this.y)
    }

    stop() {
        this.hidden = true
        this.animIndex = 0
        if (this.currentImage) this.context?.putImageData(this.currentImage, 0, 0)
        this.timeout = clearTimeoutSafe(this.timeout)
        this.sfx?.stop()
        this.sfx = undefined
    }

    private get currentImage(): ImageData {
        return this.flicImages[this.animIndex]
    }
}
