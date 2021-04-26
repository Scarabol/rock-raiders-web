import { EventManager } from '../event/EventManager'
import { CursorLayer, ScreenLayer } from './ScreenLayer'

export class BaseScreen {

    gameCanvasContainer: HTMLElement
    eventMgr: EventManager
    layers: ScreenLayer[] = []
    width: number = 800
    height: number = 600
    ratio: number = 800 / 600
    cursorLayer: CursorLayer

    constructor() {
        this.gameCanvasContainer = document.getElementById('game-canvas-container')
        this.gameCanvasContainer.focus()
        this.eventMgr = new EventManager(this)
        if (!this.gameCanvasContainer) throw 'Fatal error: game canvas container not found!'
        window.addEventListener('resize', () => this.onWindowResize())
        this.onWindowResize()
        this.cursorLayer = this.addLayer(new CursorLayer(), 1000)
    }

    addLayer<T extends ScreenLayer>(layer: T, zIndex: number = 0): T {
        layer.resize(this.width, this.height)
        layer.setZIndex(zIndex)
        this.layers.push(layer)
        this.gameCanvasContainer.appendChild(layer.canvas)
        return layer
    }

    redraw() {
        this.layers.forEach((layer) => layer.redraw())
    }

    show() {
        this.layers.forEach((layer) => layer.show())
        this.redraw()
    }

    hide() {
        this.layers.forEach((layer) => layer.hide())
    }

    onWindowResize() {
        const maxWidth = this.gameCanvasContainer.offsetWidth, maxHeight = this.gameCanvasContainer.offsetHeight
        const idealHeight = Math.round(maxWidth / this.ratio)
        if (idealHeight > maxHeight) {
            this.resize(Math.round(maxHeight * this.ratio), maxHeight)
        } else {
            this.resize(maxWidth, idealHeight)
        }
    }

    resize(width: number, height: number) {
        this.width = width
        this.height = height
        this.layers.forEach((layer) => layer.resize(width, height))
        this.redraw()
    }

    isInRect(event: MouseEvent | WheelEvent) {
        if (this.layers.length < 1) return false
        const firstLayer = this.layers[0] // all layers have same state and size
        if (!firstLayer.isActive() && !firstLayer.canvas) return false
        const rect = firstLayer.canvas.getBoundingClientRect()
        const clientX = event.clientX, clientY = event.clientY
        return clientX >= rect.left && clientX < rect.right && clientY >= rect.top && clientY < rect.bottom
    }

}
