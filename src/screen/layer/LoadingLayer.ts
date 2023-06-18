import { ResourceManager } from '../../resource/ResourceManager'
import { ScaledLayer } from './ScreenLayer'
import { DEFAULT_FONT_NAME } from '../../params'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventTypeEnum'

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
        const imgBackground = ResourceManager.getImage(ResourceManager.configuration.main.loadScreen)
        const imgProgress = ResourceManager.getImage(ResourceManager.configuration.main.progressBar)
        ResourceManager.bitmapFontWorkerPool.createTextImage(DEFAULT_FONT_NAME, ResourceManager.configuration.main.loadingText)
            .then((imgLoading) => {
                this.animationFrame.onRedraw = (context => {
                    context.drawImage(imgBackground, 0, 0)
                    const loadingBarWidth = Math.round(353 * (this.assetIndex < totalResources ? this.assetIndex / totalResources : 1))
                    context.drawImage(imgProgress, 142, 450, loadingBarWidth, 9)
                    if (imgLoading) context.drawImage(imgLoading, Math.round(320 - imgLoading.width / 2), Math.round(456 - imgLoading.height / 2))
                })
                this.animationFrame.notifyRedraw()
            })
    }

    increaseLoadingState() {
        this.assetIndex++
        this.animationFrame.notifyRedraw()
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        if (event.eventEnum === POINTER_EVENT.DOWN && event.button === MOUSE_BUTTON.MAIN) {
            if (this.screenMaster.doubleTapToFullscreen()) return true
        }
        return super.handlePointerEvent(event)
    }
}
