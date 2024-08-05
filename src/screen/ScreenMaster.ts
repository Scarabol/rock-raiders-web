import { createCanvas } from '../core/ImageHelper'
import { NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../params'
import { ScreenLayer } from './layer/ScreenLayer'
import { LoadingLayer } from './layer/LoadingLayer'
import { SaveGameManager } from '../resource/SaveGameManager'
import { HTML_GAME_CANVAS_CONTAINER, HTML_GAME_CONTAINER } from '../core'

export class ScreenMaster {
    readonly layers: ScreenLayer[] = []
    readonly loadingLayer: LoadingLayer
    width: number = NATIVE_SCREEN_WIDTH
    height: number = NATIVE_SCREEN_HEIGHT
    onGlobalMouseMoveEvent: (event: PointerEvent) => void = () => {
    }
    onGlobalMouseLeaveEvent: (event: PointerEvent) => void = () => {
    }

    constructor() {
        HTML_GAME_CANVAS_CONTAINER.addEventListener('contextmenu', (event: MouseEvent) => event.preventDefault())
        window.addEventListener('resize', () => this.onWindowResize())
        this.onWindowResize()
        HTML_GAME_CANVAS_CONTAINER.addEventListener('pointerdown', () => {
            this.getActiveLayersSorted()?.[0]?.canvas?.focus() // always focus topmost
        })
        // in case topmost layer does not listen for event, it reaches game-canvas-container as fallback dispatch from here
        ;['pointermove', 'pointerdown', 'pointerup', 'pointerleave', 'keydown', 'keyup', 'wheel', 'mousemove', 'mouseleave'].forEach((eventType) => {
            HTML_GAME_CANVAS_CONTAINER.addEventListener(eventType, (event) => {
                event.stopPropagation()
                this.dispatchEvent(event)
            })
        })
        ;['touchstart', 'touchmove', 'touchend'].forEach((eventType) => {
            HTML_GAME_CANVAS_CONTAINER.addEventListener(eventType, (event) => {
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
            const debugLayers = Array.from(document.getElementsByClassName('game-debug-layer')) as HTMLElement[]
            debugLayers.forEach((elem) => elem.style.display = elem.style.display === 'none' ? 'block' : 'none')
        })
        this.setupButton('button-screenshot', () => {
            this.saveScreenshot()
        })
        this.setupButton('button-fullscreen', () => {
            if (document.fullscreenElement === HTML_GAME_CONTAINER) document.exitFullscreen().then()
            else HTML_GAME_CONTAINER.requestFullscreen().then()
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
        if (event.type === 'pointerleave' && event.target === HTML_GAME_CANVAS_CONTAINER) return // don't dispatch, fired by setPointerCapture
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
        HTML_GAME_CANVAS_CONTAINER.appendChild(layer.canvas)
        return layer
    }

    removeLayer(layer: ScreenLayer) {
        layer.hide()
        if (this.layers.includes(layer)) {
            this.layers.remove(layer)
            HTML_GAME_CANVAS_CONTAINER.removeChild(layer.canvas)
        }
    }

    onWindowResize() {
        this.width = HTML_GAME_CONTAINER.offsetWidth - 100
        this.height = HTML_GAME_CONTAINER.offsetHeight - 1
        if (SaveGameManager.currentPreferences.screenRatioFixed > 0) {
            const idealHeight = Math.round(this.width / SaveGameManager.currentPreferences.screenRatioFixed)
            if (idealHeight > this.height) {
                this.width = Math.round(this.height * SaveGameManager.currentPreferences.screenRatioFixed)
            } else {
                this.height = idealHeight
            }
        }
        this.layers.forEach((layer) => layer.resize(this.width, this.height))
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
