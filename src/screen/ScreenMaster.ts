import { AbstractLayer } from './layer/AbstractLayer'
import { createCanvas } from '../core/ImageHelper'
import { NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../params'
import { LoadingLayer } from './layer/LoadingLayer'
import { SaveGameManager } from '../resource/SaveGameManager'
import { HTML_GAME_CANVAS_CONTAINER, HTML_GAME_CONTAINER } from '../core'
import { VideoLayer } from './layer/VideoLayer'
import { DebugHelper } from './DebugHelper'

export class ScreenMaster {
    readonly layers: AbstractLayer[] = []
    readonly loadingLayer: LoadingLayer
    readonly videoLayer: VideoLayer
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
            this.getActiveLayersSorted()?.[0]?.element?.focus() // always focus topmost
        })
        // in case topmost layer does not listen for event, it reaches game-canvas-container as fallback dispatch from here
        ;['pointermove', 'pointerdown', 'pointerup', 'pointerleave', 'keydown', 'keyup', 'keypress', 'wheel', 'mousemove', 'mouseleave'].forEach((eventType) => {
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
        const closeButton = DebugHelper.element.querySelector<HTMLButtonElement>('button.game-debug-close-button')
        if (!closeButton) throw new Error('Debug layer close button not found')
        closeButton.onclick = () => DebugHelper.toggleDisplay()
        const copyToClipboard = DebugHelper.element.querySelector<HTMLButtonElement>('button.game-debug-copy-button')
        if (!copyToClipboard) throw new Error('Debug layer copy to clipboard button not found')
        copyToClipboard.onclick = () => {
            navigator.clipboard.writeText(Array.from(DebugHelper.messageContainer.children).map((e) => (e as HTMLElement).innerText).join('\n')).then()
        }
        this.loadingLayer = this.addLayer(new LoadingLayer(), 1200)
        this.videoLayer = this.addLayer(new VideoLayer(), 1500)
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
        this.setupButton('button-debug', () => DebugHelper.toggleDisplay())
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
        nextLayer.element.dispatchEvent(eventClone)
    }

    addLayer<T extends AbstractLayer>(layer: T, zIndex: number): T {
        if (!zIndex) throw new Error(`Invalid zIndex ${zIndex} given for layer`)
        if (this.layers.some((l) => l.zIndex === zIndex)) throw new Error(`The given zIndex is not unique`)
        layer.screenMaster = this
        layer.resize(this.width, this.height)
        layer.setZIndex(zIndex)
        this.layers.push(layer)
        HTML_GAME_CANVAS_CONTAINER.appendChild(layer.element)
        return layer
    }

    removeLayer(layer: AbstractLayer) {
        layer.hide()
        if (this.layers.includes(layer)) {
            this.layers.remove(layer)
            HTML_GAME_CANVAS_CONTAINER.removeChild(layer.element)
        }
    }

    onWindowResize() {
        const aspectRatio = HTML_GAME_CONTAINER.offsetWidth / HTML_GAME_CONTAINER.offsetHeight
        this.width = HTML_GAME_CONTAINER.offsetWidth - 1 - (aspectRatio < 1.333333 ? 0 : 100)
        this.height = HTML_GAME_CONTAINER.offsetHeight - 1 - (aspectRatio < 1.333333 ? 100 : 0)
        const screenRatio = SaveGameManager.calcScreenRatio()
        if (screenRatio > 0) {
            const idealHeight = Math.round(this.width / screenRatio)
            if (idealHeight > this.height) {
                this.width = Math.round(this.height * screenRatio)
            } else {
                this.height = idealHeight
            }
        }
        this.layers.forEach((layer) => layer.resize(this.width, this.height))
    }

    getActiveLayersSorted(): AbstractLayer[] {
        return this.layers.filter(l => l.active).sort((a, b) => b.zIndex - a.zIndex)
    }

    async createScreenshot(): Promise<HTMLCanvasElement> {
        const activeLayers = this.getActiveLayersSorted().reverse()
        if (activeLayers.length < 1) return Promise.reject()
        const allLayers = await Promise.all(activeLayers.map((l) => l.takeScreenshotFromLayer()))
        const layers = allLayers.filter((l) => !!l)
        const maxLayerWidth = layers.reduce((w, l) => Math.max(w, l.width), 0)
        const maxLayerHeight = layers.reduce((h, l) => Math.max(h, l.height), 0)
        const canvas = createCanvas(maxLayerWidth, maxLayerHeight)
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Could not get context for canvas')
        layers.forEach((c) => context.drawImage(c, 0, 0))
        return canvas
    }

    saveScreenshot() {
        this.createScreenshot().then((canvas) => this.downloadCanvasAsImage(canvas))
    }

    private downloadCanvasAsImage(canvas: HTMLCanvasElement) {
        canvas.toBlob((blob) => {
            if (!blob) {
                console.error('Null instead of blob returned from canvas')
                return
            }
            const link = document.createElement('a')
            link.download = `Rock Raiders Web ${new Date().toISOString().replace('T', ' ').replace('Z', '')}.png`
            link.href = URL.createObjectURL(blob)
            link.onclick = () => setTimeout(() => URL.revokeObjectURL(link.href), 1500)
            link.click()
            link.remove()
        })
    }
}
