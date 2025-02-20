import { AbstractLayer } from './AbstractLayer'
import { SpriteImage } from '../../core/Sprite'

export class ScreenLayer extends AbstractLayer {
    canvas: HTMLCanvasElement
    readbackCanvas: HTMLCanvasElement

    constructor(layerName?: string) {
        super()
        this.canvas = this.createCanvas(layerName || this.constructor.name)
        this.readbackCanvas = this.createCanvas(`${layerName || this.constructor.name}-fastread`)
    }

    createCanvas(layerName: string): HTMLCanvasElement {
        const canvas = document.createElement('canvas')
        canvas.setAttribute('data-layer-class', layerName)
        canvas.style.visibility = 'hidden'
        return canvas
    }

    get element(): HTMLElement {
        return this.canvas
    }

    resize(width: number, height: number): void {
        if (this.ratio > 0) {
            const idealHeight = Math.round(width / this.ratio)
            if (idealHeight > height) {
                width = Math.round(height * this.ratio)
            } else {
                height = idealHeight
            }
        }
        this.canvas.width = width
        this.canvas.height = height
        this.readbackCanvas.width = this.canvas.width
        this.readbackCanvas.height = this.canvas.height
    }

    transformCoords(clientX: number, clientY: number) {
        const clientRect = this.canvas.getBoundingClientRect()
        return [clientX - clientRect.left, clientY - clientRect.top]
    }

    takeScreenshotFromLayer(): Promise<SpriteImage | undefined> {
        return Promise.resolve(this.canvas)
    }
}
