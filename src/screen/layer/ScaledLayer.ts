import { AnimationFrame } from '../AnimationFrame'
import { NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../../params'
import { ScreenLayer } from './ScreenLayer'

export class ScaledLayer extends ScreenLayer {
    readonly animationFrame: AnimationFrame
    fixedWidth: number = NATIVE_SCREEN_WIDTH
    fixedHeight: number = NATIVE_SCREEN_HEIGHT
    scaleX: number = 1
    scaleY: number = 1

    constructor(layerName?: string) {
        super(layerName)
        this.updateScale()
        this.animationFrame = new AnimationFrame(this.canvas, this.readbackCanvas)
    }

    private updateScale() {
        this.scaleX = this.canvas.width / this.fixedWidth
        this.scaleY = this.canvas.height / this.fixedHeight
    }

    override transformCoords(clientX: number, clientY: number) {
        const [cx, cy] = super.transformCoords(clientX, clientY)
        return [cx / this.scaleX, cy / this.scaleY].map((c) => Math.round(c))
    }

    override resize(width: number, height: number) {
        super.resize(width, height)
        this.updateScale()
        this.animationFrame.scale(this.scaleX, this.scaleY)
        this.animationFrame.notifyRedraw()
    }

    override show() {
        super.show()
        this.animationFrame.notifyRedraw()
    }
}
