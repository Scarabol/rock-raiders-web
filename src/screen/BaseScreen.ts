import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { EventManager } from '../event/EventManager'
import { GameEvent } from '../event/GameEvent'
import { IEventHandler } from '../event/IEventHandler'
import { SPRITE_RESOLUTION_HEIGHT, SPRITE_RESOLUTION_WIDTH } from '../params'
import { CursorLayer } from './layer/CursorLayer'
import { ScreenLayer } from './layer/ScreenLayer'

export class BaseScreen implements IEventHandler {

    gameCanvasContainer: HTMLElement
    eventMgr: EventManager
    layers: ScreenLayer[] = []
    width: number = SPRITE_RESOLUTION_WIDTH
    height: number = SPRITE_RESOLUTION_HEIGHT
    ratio: number = SPRITE_RESOLUTION_WIDTH / SPRITE_RESOLUTION_HEIGHT
    cursorLayer: CursorLayer

    constructor() {
        this.gameCanvasContainer = document.getElementById('game-canvas-container')
        this.gameCanvasContainer.focus()
        this.eventMgr = new EventManager(this)
        if (!this.gameCanvasContainer) throw new Error('Fatal error: game canvas container not found!')
        window.addEventListener('resize', () => this.onWindowResize())
        this.onWindowResize()
        this.cursorLayer = this.addLayer(new CursorLayer(this), 1000) // TODO turn cursor layer into singleton?
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
        this.layers.forEach((layer) => {
            const oldCanvas = layer.canvas
            layer.resize(width, height)
            if (oldCanvas !== layer.canvas) { // TODO refactor this
                this.gameCanvasContainer.removeChild(oldCanvas)
                this.gameCanvasContainer.appendChild(layer.canvas)
            }
        })
        this.redraw()
    }

    isInRect(event: MouseEvent | WheelEvent) {
        if (this.layers.length < 1) return false
        const firstLayer = this.layers[0] // all layers have same state and size
        if (!firstLayer.isActive() || !firstLayer.canvas) return false
        const rect = firstLayer.canvas.getBoundingClientRect()
        const clientX = event.clientX, clientY = event.clientY
        return clientX >= rect.left && clientX < rect.right && clientY >= rect.top && clientY < rect.bottom
    }

    publishEvent(event: GameEvent): void {
        EventBus.publishEvent(event)
    }

    registerEventListener(eventKey: EventKey, callback: (GameEvent) => any): void {
        EventBus.registerEventListener(eventKey, callback)
    }

}
