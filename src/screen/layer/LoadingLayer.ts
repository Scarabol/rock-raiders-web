import { ScaledLayer } from './ScreenLayer'
import { GameConfig } from '../../cfg/GameConfig'
import { SpriteImage } from '../../core/Sprite'

export class LoadingLayer extends ScaledLayer {
    progress: number = 0

    constructor() {
        super()
        this.setLoadingMessage('Loading...')
    }

    setLoadingMessage(text: string) {
        this.animationFrame.onRedraw = (context) => {
            context.fillStyle = 'black'
            context.fillRect(0, 0, this.fixedWidth, this.fixedHeight)
            context.font = '24px Arial'
            context.fillStyle = 'white'
            context.fillText('Initializing Rock Raiders Web...', 20, this.fixedHeight - 50)
            context.font = '18px Arial'
            context.fillStyle = 'white'
            context.fillText(text, 20, this.fixedHeight - 20)
        }
        this.animationFrame.notifyRedraw()
    }

    enableGraphicMode(imgBackground: SpriteImage, imgProgress: SpriteImage, imgLabel: SpriteImage) {
        const rectProgress = GameConfig.instance.main.progressWindow
        const loadX = Math.round(rectProgress.x + (rectProgress.w - imgLabel.width) / 2) + 1
        const loadY = Math.round(rectProgress.y + (rectProgress.h - imgLabel.height) / 2) + 1
        this.animationFrame.onRedraw = (context => {
            context.drawImage(imgBackground, 0, 0)
            const loadingBarWidth = Math.round(rectProgress.w * this.progress)
            context.drawImage(imgProgress, rectProgress.x, rectProgress.y, loadingBarWidth, rectProgress.h)
            context.drawImage(imgLabel, loadX, loadY)
        })
        this.animationFrame.notifyRedraw()
    }

    setLoadingProgress(progress: number) {
        this.progress = Math.max(0, Math.min(1, progress))
        this.animationFrame.notifyRedraw()
    }
}
