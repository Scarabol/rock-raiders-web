import { EventKey } from '../../event/EventKeyEnum'
import { MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GameEvent } from '../../event/GameEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { GameWheelEvent } from '../../event/GameWheelEvent'
import { IEventHandler } from '../../event/IEventHandler'
import { BaseElement } from '../../gui/base/BaseElement'
import { Panel } from '../../gui/base/Panel'
import { ScaledLayer } from './ScreenLayer'

export class GuiBaseLayer extends ScaledLayer implements IEventHandler {

    parent: IEventHandler
    rootElement: BaseElement = new BaseElement(null)
    panels: Panel[] = []

    constructor(parent: IEventHandler) {
        super()
        this.parent = parent
        this.rootElement.notifyRedraw = () => this.redraw()
        this.rootElement.publishEvent = (event: GameEvent) => this.publishEvent(event)
        this.rootElement.registerEventListener = (eventKey: EventKey, callback: (GameEvent) => any) => this.registerEventListener(eventKey, callback)
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

    handlePointerEvent(event: GamePointerEvent): boolean {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
        const [sx, sy] = this.toScaledCoords(event.clientX, event.clientY)
        const hit = this.context && this.context.getImageData(cx, cy, 1, 1).data[3] > 0
        if (hit) {
            if (event.eventEnum === POINTER_EVENT.MOVE) {
                this.rootElement.checkHover(sx, sy)
            } else if (event.eventEnum === POINTER_EVENT.DOWN) {
                if (event.button === MOUSE_BUTTON.MAIN) this.rootElement.checkClick(sx, sy)
            } else if (event.eventEnum === POINTER_EVENT.UP) {
                if (event.button === MOUSE_BUTTON.MAIN) this.rootElement.checkRelease(sx, sy)
            }
        } else if (event.eventEnum === POINTER_EVENT.MOVE) {
            this.rootElement.release()
        }
        return hit
    }

    handleWheelEvent(event: GameWheelEvent): boolean {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
        return !this.context || this.context.getImageData(cx, cy, 1, 1).data[3] > 0
    }

    publishEvent(event: GameEvent): void {
        this.parent?.publishEvent(event)
    }

    registerEventListener(eventKey: EventKey, callback: (GameEvent) => any): void {
        this.parent.registerEventListener(eventKey, callback)
    }

}
