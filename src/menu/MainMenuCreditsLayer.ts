import { ResourceManager } from '../resource/ResourceManager'
import { ScaledLayer } from '../screen/layer/ScreenLayer'
import { NATIVE_UPDATE_INTERVAL } from '../params'
import { clearTimeoutSafe } from '../core/Util'
import { SpriteImage } from '../core/Sprite'
import { AVIVideoStream } from '../resource/fileparser/avi/AVIVideoStream'
import { UiElementCallback } from './UiElementState'

export class MainMenuCreditsLayer extends ScaledLayer {
    static readonly FONT = 'Interface/Fonts/RSFont.bmp'

    readonly maxNumOfLinesOnScreen: number
    readonly currentLines: SpriteImage[] = []
    readonly renderedBitmapLines: SpriteImage[] = []
    readonly backVideo: AVIVideoStream
    backImg: SpriteImage
    loopIndexTimeout: NodeJS.Timeout = null
    offsetY: number = 0
    counter: number = 0
    onExitCredits: UiElementCallback = null

    constructor() {
        super('credits')
        const fontHeight = ResourceManager.bitmapFontWorkerPool.getFontHeight(MainMenuCreditsLayer.FONT)
        this.maxNumOfLinesOnScreen = Math.round(this.fixedHeight / fontHeight)
        const creditsTextContent: string = '\n'.repeat(this.maxNumOfLinesOnScreen) + ResourceManager.getResource(ResourceManager.configuration.main.creditsTextFile) + '\n\n\n\nWeb Port\n\nScarabol'
        const bitmapLines = creditsTextContent.split('\n').map((line) => {
            return ResourceManager.bitmapFontWorkerPool.createTextImage(MainMenuCreditsLayer.FONT, line, this.fixedWidth, true)
        })
        const videoStreams: AVIVideoStream[] = ResourceManager.getResource(ResourceManager.configuration.main.creditsBackAVI).videoStreams
        if (videoStreams.length !== 1) throw new Error(`Unexpected number of background video streams; got ${videoStreams.length} instead of 1`)
        this.backVideo = videoStreams[0]
        this.backImg = this.backVideo.getNextFrame()
        this.animationFrame.onRedraw = (context) => {
            context.drawImage(this.backImg, 0, 0, this.fixedWidth, this.fixedHeight)
        }
        Promise.all((bitmapLines)).then((bitmapLines) => {
            this.renderedBitmapLines.push(...bitmapLines)
            this.counter = this.maxNumOfLinesOnScreen + 5
            this.currentLines.push(...this.renderedBitmapLines.slice(0, this.counter))
            this.animationFrame.onRedraw = (context) => {
                context.drawImage(this.backImg, 0, 0, this.fixedWidth, this.fixedHeight)
                this.currentLines.forEach((lineImage, index) => {
                    if (lineImage) context.drawImage(lineImage, (this.fixedWidth - lineImage.width) / 2, Math.round(index * fontHeight - this.offsetY))
                })
            }
        })
        this.addEventListener('pointerup', (): boolean => {
            if (this.onExitCredits) {
                this.onExitCredits()
                return true
            }
            return false
        })
        this.addEventListener('keyup', (event: KeyboardEvent): boolean => {
            if (event.code === 'Escape' && this.onExitCredits) {
                this.onExitCredits()
                return true
            }
            return false
        })
    }

    show() {
        super.show()
        this.increaseLoopIndex()
    }

    increaseLoopIndex() {
        this.loopIndexTimeout = clearTimeoutSafe(this.loopIndexTimeout)
        this.loopIndexTimeout = setTimeout(() => {
            this.backImg = this.backVideo.getNextFrame()
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
