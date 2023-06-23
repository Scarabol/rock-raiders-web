import { cloneContext } from '../core/ImageHelper'
import { getElementByIdOrThrow } from '../core/Util'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../params'
import { ScreenLayer } from './layer/ScreenLayer'
import { CursorManager } from './CursorManager'
import { ChangeCursor } from '../event/GuiCommand'
import { NerpRunner } from '../nerp/NerpRunner'
import { SaveScreenshot } from '../event/LocalEvents'

export class ScreenMaster {
    gameContainer: HTMLElement
    gameCanvasContainer: HTMLElement
    layers: ScreenLayer[] = []
    width: number = NATIVE_SCREEN_WIDTH
    height: number = NATIVE_SCREEN_HEIGHT
    ratio: number = NATIVE_SCREEN_WIDTH / NATIVE_SCREEN_HEIGHT

    constructor() {
        this.gameContainer = getElementByIdOrThrow('game-container')
        this.gameCanvasContainer = getElementByIdOrThrow('game-canvas-container')
        this.gameCanvasContainer.addEventListener('contextmenu', (event: MouseEvent) => event.preventDefault())
        window.addEventListener('resize', () => this.onWindowResize())
        this.onWindowResize()
        EventBus.registerEventListener(EventKey.SAVE_SCREENSHOT, () => this.saveScreenshot())
        const cursorManager: CursorManager = new CursorManager(this.gameCanvasContainer)
        EventBus.registerEventListener(EventKey.COMMAND_CHANGE_CURSOR, (event: ChangeCursor) => {
            cursorManager.changeCursor(event.cursor, event.timeout)
        })
        this.gameCanvasContainer.addEventListener('pointerdown', () => {
            this.getActiveLayersSorted()?.[0]?.canvas?.focus() // always focus topmost
        })
        // in case topmost layer (usually cursor layer) does not listen for event, it reaches game-canvas-container as fallback dispatch from here
        ;['pointermove', 'pointerdown', 'pointerup', 'pointerleave', 'keydown', 'keyup', 'wheel'].forEach((eventType: keyof HTMLElementEventMap) => {
            this.gameCanvasContainer.addEventListener(eventType, (event) => {
                event.stopPropagation()
                this.dispatchEvent(event)
            })
        })
        ;['touchstart', 'touchmove', 'touchend'].forEach((eventType: keyof HTMLElementEventMap) => {
            this.gameCanvasContainer.addEventListener(eventType, (event) => {
                event.preventDefault()
                event.stopPropagation()
                this.dispatchEvent(event)
            })
        })
        this.setupToolbarButtons()
    }

    private setupToolbarButtons() {
        Array.from(document.getElementsByClassName('button-escape')).forEach((btn: HTMLButtonElement) => {
            btn.style.removeProperty('visibility')
            btn.onclick = (event) => {
                event.stopPropagation()
                this.dispatchEvent(new KeyboardEvent('keydown', {code: 'Escape', key: 'Escape'}))
                setTimeout(() => this.dispatchEvent(new KeyboardEvent('keyup', {code: 'Escape', key: 'Escape'})), 69)
            }
        })
        Array.from(document.getElementsByClassName('button-space')).forEach((btn: HTMLButtonElement) => {
            btn.style.removeProperty('visibility')
            btn.onclick = (event) => {
                event.stopPropagation()
                this.dispatchEvent(new KeyboardEvent('keydown', {code: ' ', key: ' '}))
                setTimeout(() => this.dispatchEvent(new KeyboardEvent('keyup', {code: ' ', key: ' '})), 69)
            }
        })
        Array.from(document.getElementsByClassName('button-screenshot')).forEach((btn: HTMLButtonElement) => {
            btn.style.removeProperty('visibility')
            btn.onclick = (event) => {
                event.stopPropagation()
                EventBus.publishEvent(new SaveScreenshot())
            }
        })
        Array.from(document.getElementsByClassName('button-debug-nerp')).forEach((btn: HTMLButtonElement) => {
            btn.style.removeProperty('visibility')
            btn.onclick = (event) => {
                event.stopPropagation()
                NerpRunner.debug = !NerpRunner.debug
            }
        })
        Array.from(document.getElementsByClassName('button-fullscreen')).forEach((btn: HTMLButtonElement) => {
            btn.style.removeProperty('visibility')
            btn.onclick = (event) => {
                event.stopPropagation()
                if (document.fullscreenElement === this.gameContainer) document.exitFullscreen().then()
                else this.gameContainer?.requestFullscreen().then()
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
        return this.layers.filter(l => l.isActive()).sort((a, b) => b.zIndex - a.zIndex)
    }

    createScreenshot(): Promise<HTMLCanvasElement> {
        const activeLayers = this.getActiveLayersSorted().reverse()
        if (activeLayers.length < 1) return Promise.reject()
        const context = cloneContext(activeLayers[0].canvas)
        return new Promise<HTMLCanvasElement>((resolve) => {
            Promise.all(activeLayers.map((l) => l.takeScreenshotFromLayer())).then((layers) => {
                layers.forEach((c) => context.drawImage(c, 0, 0))
                resolve(context.canvas)
            })
        })
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
