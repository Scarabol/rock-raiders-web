import { createCanvas } from '../core/ImageHelper'
import { getElementByIdOrThrow } from '../core/Util'
import { EventKey } from '../event/EventKeyEnum'
import { NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../params'
import { ScreenLayer } from './layer/ScreenLayer'
import { CursorManager } from './CursorManager'
import { ChangeCursor } from '../event/GuiCommand'
import { SaveScreenshot } from '../event/LocalEvents'
import { LoadingLayer } from './layer/LoadingLayer'
import { EventBroker } from '../event/EventBroker'

export class ScreenMaster {
    readonly gameContainer: HTMLElement
    readonly gameCanvasContainer: HTMLElement
    readonly layers: ScreenLayer[] = []
    readonly ratio: number = NATIVE_SCREEN_WIDTH / NATIVE_SCREEN_HEIGHT
    readonly loadingLayer: LoadingLayer
    width: number = NATIVE_SCREEN_WIDTH
    height: number = NATIVE_SCREEN_HEIGHT

    constructor() {
        this.gameContainer = getElementByIdOrThrow('game-container')
        this.gameCanvasContainer = getElementByIdOrThrow('game-canvas-container')
        this.gameCanvasContainer.addEventListener('contextmenu', (event: MouseEvent) => event.preventDefault())
        window.addEventListener('resize', () => this.onWindowResize())
        this.onWindowResize()
        EventBroker.subscribe(EventKey.SAVE_SCREENSHOT, () => this.saveScreenshot())
        const cursorManager: CursorManager = new CursorManager(this.gameCanvasContainer)
        EventBroker.subscribe(EventKey.COMMAND_CHANGE_CURSOR, (event: ChangeCursor) => {
            cursorManager.changeCursor(event.cursor, event.timeout)
        })
        this.gameCanvasContainer.addEventListener('pointerdown', () => {
            this.getActiveLayersSorted()?.[0]?.canvas?.focus() // always focus topmost
        })
        // in case topmost layer (usually cursor layer) does not listen for event, it reaches game-canvas-container as fallback dispatch from here
        ;['pointermove', 'pointerdown', 'pointerup', 'pointerleave', 'keydown', 'keyup', 'wheel'].forEach((eventType) => {
            this.gameCanvasContainer.addEventListener(eventType, (event) => {
                event.stopPropagation()
                this.dispatchEvent(event)
            })
        })
        ;['touchstart', 'touchmove', 'touchend'].forEach((eventType) => {
            this.gameCanvasContainer.addEventListener(eventType, (event) => {
                event.preventDefault()
                event.stopPropagation()
                this.dispatchEvent(event)
            })
        })
        this.setupToolbarButtons()
        this.loadingLayer = this.addLayer(new LoadingLayer(), 1500)
        this.loadingLayer.show()
    }

    private setupToolbarButtons() {
        this.setupButton('button-escape', () => {
            this.dispatchEvent(new KeyboardEvent('keydown', {code: 'Escape', key: 'Escape'}))
            setTimeout(() => this.dispatchEvent(new KeyboardEvent('keyup', {code: 'Escape', key: 'Escape'})), 69)
        })
        this.setupButton('button-space', () => {
            this.dispatchEvent(new KeyboardEvent('keydown', {code: ' ', key: ' '}))
            setTimeout(() => this.dispatchEvent(new KeyboardEvent('keyup', {code: ' ', key: ' '})), 69)
        })
        this.setupButton('button-debug', () => {
            const buttons = Array.from(document.getElementsByClassName('game-debug-layer')) as HTMLElement[]
            buttons.forEach((btn) => btn.style.display = btn.style.display === 'none' ? 'block' : 'none')
        })
        this.setupButton('button-screenshot', () => {
            EventBroker.publish(new SaveScreenshot())
        })
        this.setupButton('button-fullscreen', () => {
            if (document.fullscreenElement === this.gameContainer) document.exitFullscreen().then()
            else this.gameContainer?.requestFullscreen().then()
        })
    }

    private setupButton(clsName: string, onClickCallback: () => void): void {
        const buttons = Array.from(document.getElementsByClassName(clsName)) as HTMLButtonElement[]
        buttons.forEach((btn) => {
            btn.style.removeProperty('visibility')
            btn.onclick = (event) => {
                event.stopPropagation()
                onClickCallback()
            }
        })
    }

    dispatchEvent(event: Event, zIndexStart: number = Infinity) {
        if (event.type === 'pointerleave' && event.target === this.gameCanvasContainer) return // don't dispatch, fired by setPointerCapture
        const activeLayersSorted = this.getActiveLayersSorted()
        const nextLayer = activeLayersSorted.find((l) => l.zIndex < zIndexStart && l.eventListener.has(event.type))
        if (!nextLayer) return
        // @ts-ignore // XXX maybe there is more elegant way to clone events
        const eventClone = new event.constructor(event.type, event)
        nextLayer.canvas.dispatchEvent(eventClone)
    }

    addLayer<T extends ScreenLayer>(layer: T, zIndex: number): T {
        if (!zIndex) throw new Error(`Invalid zIndex ${zIndex} given for layer`)
        if (this.layers.some((l) => l.zIndex === zIndex)) throw new Error(`The given zIndex is not unique`)
        layer.screenMaster = this
        layer.resize(this.width, this.height)
        layer.setZIndex(zIndex)
        this.layers.push(layer)
        this.gameCanvasContainer.appendChild(layer.canvas)
        return layer
    }

    removeLayer(layer: ScreenLayer) {
        layer.hide()
        if (this.layers.includes(layer)) {
            this.layers.remove(layer)
            this.gameCanvasContainer.removeChild(layer.canvas)
        }
    }

    private onWindowResize() {
        const maxWidth = this.gameContainer.offsetWidth
        const maxHeight = this.gameContainer.offsetHeight
        const idealHeight = Math.round(maxWidth / this.ratio)
        if (idealHeight > maxHeight) {
            const width = Math.round(maxHeight * this.ratio)
            this.resize(width, maxHeight)
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
        return this.layers.filter(l => l.isActive()).sort((a, b) => b.zIndex - a.zIndex)
    }

    async createScreenshot(): Promise<HTMLCanvasElement> {
        const activeLayers = this.getActiveLayersSorted().reverse()
        if (activeLayers.length < 1) return Promise.reject()
        const layers = await Promise.all(activeLayers.map((l) => l.takeScreenshotFromLayer()))
        const maxLayerWidth = layers.reduce((w, l) => Math.max(w, l.width), 0)
        const maxLayerHeight = layers.reduce((h, l) => Math.max(h, l.height), 0)
        const canvas = createCanvas(maxLayerWidth, maxLayerHeight)
        const context = canvas.getContext('2d')
        layers.forEach((c) => context.drawImage(c, 0, 0))
        return canvas
    }

    saveScreenshot() {
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
