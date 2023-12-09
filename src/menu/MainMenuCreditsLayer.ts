import { ResourceManager } from '../resource/ResourceManager'
import { ScaledLayer } from '../screen/layer/ScreenLayer'
import { NATIVE_UPDATE_INTERVAL } from '../params'
import { clearTimeoutSafe } from '../core/Util'
import { SpriteImage } from '../core/Sprite'
import { RRWVideoDecoder } from '../resource/fileparser/AVIParser'
import { imgDataToCanvas } from '../core/ImageHelper'

export class MainMenuCreditsLayer extends ScaledLayer {
    static readonly FONT = 'Interface/Fonts/RSFont.bmp'

    readonly maxNumOfLinesOnScreen: number
    readonly currentLines: SpriteImage[] = []
    readonly renderedBitmapLines: SpriteImage[] = []
    readonly decoder: RRWVideoDecoder
    loopFrame: ImageData
    loopIndexTimeout: NodeJS.Timeout = null
    offsetY: number = 0
    counter: number = 0

    constructor() {
        super('credits')
        const fontHeight = ResourceManager.bitmapFontWorkerPool.getFontHeight(MainMenuCreditsLayer.FONT)
        this.maxNumOfLinesOnScreen = Math.round(this.fixedHeight / fontHeight)
        const creditsTextContent: string = '\n'.repeat(this.maxNumOfLinesOnScreen) + ResourceManager.getResource(ResourceManager.configuration.main.creditsTextFile) + '\n\n\n\nWeb Port\n\nScarabol'
        const bitmapLines = creditsTextContent.split('\n').map((line) => {
            return ResourceManager.bitmapFontWorkerPool.createTextImage(MainMenuCreditsLayer.FONT, line, this.fixedWidth, true)
        })
        this.decoder = ResourceManager.getResource(ResourceManager.configuration.main.creditsBackAVI)
        this.loopFrame = this.decoder.getNextFrame()
        this.animationFrame.onRedraw = (context) => {
            context.drawImage(imgDataToCanvas(this.loopFrame), 0, 0, this.fixedWidth, this.fixedHeight)
        }
        Promise.all((bitmapLines)).then((bitmapLines) => {
            this.renderedBitmapLines.push(...bitmapLines)
            this.counter = this.maxNumOfLinesOnScreen + 5
            this.currentLines.push(...this.renderedBitmapLines.slice(0, this.counter))
            this.animationFrame.onRedraw = (context) => {
                context.drawImage(imgDataToCanvas(this.loopFrame), 0, 0, this.fixedWidth, this.fixedHeight)
                this.currentLines.forEach((lineImage, index) => {
                    if (lineImage) context.drawImage(lineImage, (this.fixedWidth - lineImage.width) / 2, Math.round(index * fontHeight - this.offsetY))
                })
            }
        })
    }

    show() {
        super.show()
        this.increaseLoopIndex()
    }

    increaseLoopIndex() {
        this.loopIndexTimeout = clearTimeoutSafe(this.loopIndexTimeout)
        this.loopIndexTimeout = setTimeout(() => {
            this.loopFrame = this.decoder.getNextFrame()
            if (this.offsetY > 17) {
                this.currentLines.shift()
                this.currentLines.push(this.renderedBitmapLines[this.counter])
                this.counter = (this.counter + 1) % this.renderedBitmapLines.length
                this.offsetY -= 17
            }
            this.offsetY = this.offsetY + 0.8
            this.animationFrame.notifyRedraw()
            this.increaseLoopIndex()
        }, NATIVE_UPDATE_INTERVAL) // XXX get actual render update rate from AVI metadata
    }

    hide() {
        super.hide()
        this.loopIndexTimeout = clearTimeoutSafe(this.loopIndexTimeout)
        this.offsetY = 0
        this.counter = this.maxNumOfLinesOnScreen + 5
        this.currentLines.length = 0
        this.currentLines.push(...this.renderedBitmapLines.slice(0, this.counter))
    }
}
