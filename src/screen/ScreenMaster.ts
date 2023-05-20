import { cloneContext } from '../core/ImageHelper'
import { getElementByIdOrThrow } from '../core/Util'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { EventManager } from '../event/EventManager'
import { NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../params'
import { ScreenLayer } from './layer/ScreenLayer'

export class ScreenMaster {
    gameContainer: HTMLElement
    gameCanvasContainer: HTMLElement
    eventMgr: EventManager
    layers: ScreenLayer[] = []
    width: number = NATIVE_SCREEN_WIDTH
    height: number = NATIVE_SCREEN_HEIGHT
    ratio: number = NATIVE_SCREEN_WIDTH / NATIVE_SCREEN_HEIGHT
    focusedLayer: ScreenLayer = null

    constructor() {
        this.gameContainer = getElementByIdOrThrow('game-container')
        this.gameCanvasContainer = getElementByIdOrThrow('game-canvas-container')
        this.eventMgr = new EventManager(this)
        window.addEventListener('resize', () => this.onWindowResize())
        this.onWindowResize()
        EventBus.registerEventListener(EventKey.TAKE_SCREENSHOT, () => this.takeScreenshot())
    }

    addLayer<T extends ScreenLayer>(layer: T, zIndex: number): T {
        layer.resize(this.width, this.height)
        layer.setZIndex(zIndex)
        this.layers.push(layer)
        this.gameCanvasContainer.appendChild(layer.canvas)
        return layer
    }

    private onWindowResize() {
        const maxWidth = this.gameContainer.offsetWidth
        const maxHeight = this.gameContainer.offsetHeight
        const idealHeight = Math.round(maxWidth / this.ratio)
        if (idealHeight > maxHeight) {
            this.resize(Math.round(maxHeight * this.ratio), maxHeight)
        } else {
            this.resize(maxWidth, idealHeight)
        }
    }

    private resize(width: number, height: number) {
        this.width = width
        this.height = height
        this.layers.forEach((layer) => layer.resize(width, height))
    }

    getActiveLayersSorted(): ScreenLayer[] {
        if (this.focusedLayer) return [this.focusedLayer]
        return this.layers.filter(l => l.isActive()).sort((a, b) => ScreenLayer.compareZ(a, b))
    }

    createScreenshot(): Promise<HTMLCanvasElement> {
        const activeLayers = this.getActiveLayersSorted().reverse()
        if (activeLayers.length < 1) return new Promise((_, reject) => reject())
        const context = cloneContext(activeLayers[0].canvas)
        return new Promise<HTMLCanvasElement>((resolve) => {
            Promise.all(activeLayers.map((l) => l.takeScreenshotFromLayer())).then((layers) => {
                layers.forEach((c) => context.drawImage(c, 0, 0))
                resolve(context.canvas)
            })
        })
    }

    takeScreenshot() {
        this.createScreenshot().then((canvas) => this.downloadCanvasAsImage(canvas))
    }

    private downloadCanvasAsImage(canvas: HTMLCanvasElement) {
        canvas.toBlob((blob) => {
            const link = document.createElement('a')
            link.download = `Rock Raiders Web ${new Date().toISOString().replace('T', ' ').replace('Z', '')}.png`
            link.href = URL.createObjectURL(blob)
            link.onclick = () => setTimeout(() => URL.revokeObjectURL(link.href), 1500)
            link.click()
            link.remove()
        })
    }
}
