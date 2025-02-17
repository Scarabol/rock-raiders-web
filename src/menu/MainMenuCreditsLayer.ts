import { ResourceManager } from '../resource/ResourceManager'
import { ScaledLayer } from '../screen/layer/ScreenLayer'
import { NATIVE_UPDATE_INTERVAL } from '../params'
import { clearTimeoutSafe } from '../core/Util'
import { SpriteImage } from '../core/Sprite'
import { AVIVideoStream } from '../resource/fileparser/avi/AVIVideoStream'
import { UiElementCallback } from './UiElementState'
import { BitmapFontWorkerPool } from '../worker/BitmapFontWorkerPool'
import { GameConfig } from '../cfg/GameConfig'

export class MainMenuCreditsLayer extends ScaledLayer {
    static readonly FONT = 'Interface/Fonts/RSFont.bmp'

    readonly maxNumOfLinesOnScreen: number
    readonly currentLines: (SpriteImage | undefined)[] = []
    readonly renderedBitmapLines: (SpriteImage | undefined)[] = []
    readonly backVideo?: AVIVideoStream
    backImg?: SpriteImage
    loopIndexTimeout?: NodeJS.Timeout
    offsetY: number = 0
    counter: number = 0
    onExitCredits?: UiElementCallback

    constructor() {
        super('credits')
        const fontHeight = BitmapFontWorkerPool.instance.getFontHeight(MainMenuCreditsLayer.FONT)
        this.maxNumOfLinesOnScreen = Math.round(this.fixedHeight / fontHeight)
        const creditsTextContent: string = '\n'.repeat(this.maxNumOfLinesOnScreen) + ResourceManager.getResource(GameConfig.instance.main.creditsTextFile) + '\n\n\nWeb implementation\n\nScarabol'
        const bitmapLines = creditsTextContent.split('\n').map((line) => {
            return BitmapFontWorkerPool.instance.createTextImage(MainMenuCreditsLayer.FONT, line, this.fixedWidth, true)
        })
        const creditsBackAVI = ResourceManager.getResource(GameConfig.instance.main.creditsBackAVI)
        if (creditsBackAVI) {
            const videoStreams: AVIVideoStream[] = creditsBackAVI.videoStreams
            if (videoStreams.length !== 1) throw new Error(`Unexpected number of background video streams; got ${videoStreams.length} instead of 1`)
            this.backVideo = videoStreams[0]
            this.backImg = this.backVideo.getNextFrame()
            this.animationFrame.onRedraw = (context) => {
                if (this.backImg) context.drawImage(this.backImg, 0, 0, this.fixedWidth, this.fixedHeight)
            }
        }
        Promise.all((bitmapLines)).then((bitmapLines) => {
            this.renderedBitmapLines.push(...bitmapLines)
            this.counter = this.maxNumOfLinesOnScreen + 5
            this.currentLines.push(...this.renderedBitmapLines.slice(0, this.counter))
            this.animationFrame.onRedraw = (context) => {
                context.clearRect(0, 0, this.fixedWidth, this.fixedHeight)
                if (this.backImg) context.drawImage(this.backImg, 0, 0, this.fixedWidth, this.fixedHeight)
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
            if (this.backVideo) this.backImg = this.backVideo.getNextFrame()
            if (this.offsetY > 17) {
                this.currentLines.shift()
                this.currentLines.push(this.renderedBitmapLines[this.counter])
                this.counter = (this.counter + 1) % this.renderedBitmapLines.length
                this.offsetY -= 17
            }
            this.offsetY = this.offsetY + 0.8
            this.animationFrame.notifyRedraw()
            this.increaseLoopIndex()
        }, NATIVE_UPDATE_INTERVAL)
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
