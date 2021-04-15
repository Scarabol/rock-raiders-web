import { BaseScreen } from './BaseScreen'
import { ResourceManager } from '../resource/ResourceManager'
import { ScaledLayer } from './ScreenLayer'

export class LoadingScreen extends BaseScreen {

    layer: ScaledLayer
    assetIndex: number = 0

    constructor() {
        super()
        this.layer = this.addLayer(new ScaledLayer())
    }

    show() {
        this.layers.forEach((layer) => {
            if (layer !== this.cursorLayer) layer.show()
        })
        this.setLoadingMessage('Loading...')
    }

    setLoadingMessage(text) {
        this.layer.onRedraw = (context) => {
            // clear the screen to black
            context.fillStyle = 'black'
            context.fillRect(0, 0, this.layer.fixedWidth, this.layer.fixedHeight)
            // draw the loading title
            context.font = '24px Arial'
            context.fillStyle = 'white'
            context.fillText('Loading Rock Raiders', 20, this.layer.fixedHeight - 50)
            // hard-code the first loading message
            context.font = '18px Arial'
            context.fillStyle = 'white'
            context.fillText(text, 20, this.layer.fixedHeight - 20)
        }
        this.redraw()
    }

    enableGraphicMode(totalResources: number) {
        const imgBackground = ResourceManager.getImage(ResourceManager.cfg('Main', 'LoadScreen'))
        const imgProgress = ResourceManager.getImage(ResourceManager.cfg('Main', 'ProgressBar'))
        const imgLoading = ResourceManager.getDefaultFont().createTextImage(ResourceManager.cfg('Main', 'LoadingText'))
        this.layer.onRedraw = (context => {
            const loadingBarWidth = Math.round(353 * this.assetIndex / totalResources)
            context.drawImage(imgBackground, 0, 0)
            context.drawImage(imgProgress, 142, 450, loadingBarWidth, 9)
            context.drawImage(imgLoading, Math.round(320 - imgLoading.width / 2), Math.round(456 - imgLoading.height / 2))
        })
        this.cursorLayer.show()
        this.redraw()
    }

    setLoadingState(assetIndex) {
        if (this.assetIndex === assetIndex) return
        this.assetIndex = assetIndex
        this.redraw()
    }

}
