import { MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventTypeEnum'
import { ScaledLayer } from '../../screen/ScreenLayer'
import { BaseElement } from '../gui/base/BaseElement'
import { Panel } from '../gui/base/Panel'

export class GuiBaseLayer extends ScaledLayer {

    rootElement: BaseElement = new BaseElement()
    panels: Panel[] = []

    constructor() {
        super()
        this.rootElement.notifyRedraw = () => this.redraw()
        this.onRedraw = (context: CanvasRenderingContext2D) => {
            context.clearRect(0, 0, context.canvas.width, context.canvas.height)
            this.rootElement.onRedraw(context)
        }
    }

    reset() {
        super.reset()
        this.panels.forEach((p) => p.reset())
    }

    addPanel<T extends Panel>(panel: T): T {
        this.rootElement.addChild(panel)
        this.panels.push(panel)
        return panel
    }

    handlePointerEvent(eventEnum: POINTER_EVENT, event: PointerEvent): boolean {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
        const [sx, sy] = this.toScaledCoords(event.clientX, event.clientY)
        const hit = this.context && this.context.getImageData(cx, cy, 1, 1).data[3] > 0
        if (hit) {
            event.preventDefault()
            if (eventEnum === POINTER_EVENT.MOVE) {
                this.rootElement.checkHover(sx, sy)
            } else if (eventEnum === POINTER_EVENT.DOWN) {
                if (event.button === MOUSE_BUTTON.MAIN) this.rootElement.checkClick(sx, sy)
            } else if (eventEnum === POINTER_EVENT.UP) {
                if (event.button === MOUSE_BUTTON.MAIN) this.rootElement.checkRelease(sx, sy)
            }
        } else if (eventEnum === POINTER_EVENT.MOVE) {
            this.rootElement.release()
        }
        return hit
    }

    handleWheelEvent(event: WheelEvent): boolean {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
        return !this.context || this.context.getImageData(cx, cy, 1, 1).data[3] > 0
    }

}
