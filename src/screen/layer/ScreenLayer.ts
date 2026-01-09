import { AbstractLayer } from './AbstractLayer'
import { SpriteImage } from '../../core/Sprite'

export class ScreenLayer extends AbstractLayer {
    readonly canvas: HTMLCanvasElement

    constructor(layerName?: string) {
        super()
        this.canvas = this.createCanvas(layerName || this.constructor.name)
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
        this.setCanvasSize(width, height)
    }

    setCanvasSize(width: number, height: number): void {
        this.canvas.width = width
        this.canvas.height = height
    }

    transformCoords(clientX: number, clientY: number) {
        const clientRect = this.canvas.getBoundingClientRect()
        return [clientX - clientRect.left, clientY - clientRect.top]
    }

    takeScreenshotFromLayer(): Promise<SpriteImage | undefined> {
        return Promise.resolve(this.canvas)
    }
}
