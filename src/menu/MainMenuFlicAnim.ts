import { MainMenuBaseItem } from './MainMenuBaseItem'
import { Rect } from '../core/Rect'
import { SpriteContext, SpriteImage } from '../core/Sprite'
import { ResourceManager } from '../resource/ResourceManager'
import { imgDataToCanvas } from '../core/ImageHelper'
import { NATIVE_UPDATE_INTERVAL } from '../params'
import { ScaledLayer } from '../screen/layer/ScreenLayer'

export class MainMenuFlicAnim extends MainMenuBaseItem {
    readonly flicImages: SpriteImage[] = []
    animIndex: number = 0

    constructor(readonly layer: ScaledLayer, flhFilepath: string, rect: Rect) {
        super(rect.x, rect.y, rect.w, rect.h)
        this.flicImages = ResourceManager.getResource(flhFilepath).map((f) => imgDataToCanvas(f))
    }

    play(): Promise<void> {
        return new Promise((resolve) => {
            this.animIndex = 0
            this.trigger(resolve)
        })
    }

    private trigger(resolve: (value: (PromiseLike<void> | void)) => void) {
        this.state.stateChanged = true
        this.layer.animationFrame.notifyRedraw()
        if (this.animIndex < this.flicImages.length) {
            setTimeout(() => {
                this.animIndex++
                this.trigger(resolve)
            }, NATIVE_UPDATE_INTERVAL)
        } else {
            resolve()
        }
    }

    draw(context: SpriteContext) {
        super.draw(context)
        const img = this.flicImages[this.animIndex]
        if (img) context.drawImage(img, this.x, this.y)
    }
}
