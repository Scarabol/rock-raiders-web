import { ResourceManager } from '../../resource/ResourceManager'
import { ScaledLayer } from './ScreenLayer'
import { DEFAULT_FONT_NAME } from '../../params'
import { BitmapFontWorkerPool } from '../../worker/BitmapFontWorkerPool'
import { GameConfig } from '../../cfg/GameConfig'

export class LoadingLayer extends ScaledLayer {
    assetIndex: number = 0

    constructor() {
        super()
        this.setLoadingMessage('Loading...')
    }

    setLoadingMessage(text: string) {
        this.animationFrame.onRedraw = (context) => {
            // clear the screen to black
            context.fillStyle = 'black'
            context.fillRect(0, 0, this.fixedWidth, this.fixedHeight)
            // draw the loading title
            context.font = '24px Arial'
            context.fillStyle = 'white'
            context.fillText('Initializing Rock Raiders Web...', 20, this.fixedHeight - 50)
            // hard-code the first loading message
            context.font = '18px Arial'
            context.fillStyle = 'white'
            context.fillText(text, 20, this.fixedHeight - 20)
        }
        this.animationFrame.notifyRedraw()
    }

    enableGraphicMode(totalResources: number) {
        const imgBackground = ResourceManager.getImage(GameConfig.instance.main.loadScreen)
        const imgProgress = ResourceManager.getImage(GameConfig.instance.main.progressBar)
        const rectProgress = GameConfig.instance.main.progressWindow
        BitmapFontWorkerPool.instance.createTextImage(DEFAULT_FONT_NAME, GameConfig.instance.main.loadingText)
            .then((imgLoading) => {
                const loadX = Math.round(rectProgress.x + (rectProgress.w - imgLoading.width) / 2) + 1
                const loadY = Math.round(rectProgress.y + (rectProgress.h - imgLoading.height) / 2) + 1
                this.animationFrame.onRedraw = (context => {
                    context.drawImage(imgBackground, 0, 0)
                    const loadingBarWidth = Math.round(rectProgress.w * (this.assetIndex < totalResources ? this.assetIndex / totalResources : 1))
                    context.drawImage(imgProgress, rectProgress.x, rectProgress.y, loadingBarWidth, rectProgress.h)
                    context.drawImage(imgLoading, loadX, loadY)
                })
                this.animationFrame.notifyRedraw()
            })
    }

    increaseLoadingState() {
        this.assetIndex++
        this.animationFrame.notifyRedraw()
    }
}
