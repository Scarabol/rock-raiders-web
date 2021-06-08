import { EventKey } from '../event/EventKeyEnum'
import { POINTER_EVENT } from '../event/EventTypeEnum'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { GameWheelEvent } from '../event/GameWheelEvent'
import { ChangeCursor, LocalEvent } from '../event/LocalEvents'
import { SPRITE_RESOLUTION_HEIGHT, SPRITE_RESOLUTION_WIDTH } from '../params'
import { Cursor } from '../screen/Cursor'
import { OffscreenWorker } from '../worker/OffscreenWorker'
import { BaseElement } from './base/BaseElement'
import { Panel } from './base/Panel'

export abstract class GuiWorker extends OffscreenWorker {

    rootElement: BaseElement = new BaseElement(null)
    panels: Panel[] = []

    protected constructor(worker: Worker) {
        super(worker)
        this.rootElement.notifyRedraw = () => this.redraw()
        this.rootElement.publishEvent = (event: LocalEvent) => {
            this.publishEvent(event)
        }
        this.rootElement.registerEventListener = (eventKey: EventKey, callback: (GameEvent) => any) => {
            this.registerEventListener(eventKey, callback)
        }
    }

    redraw() {
        super.redraw()
        this.rootElement.onRedraw(this.context)
    }

    reset() {
        this.panels.forEach((p) => p.reset())
    }

    addPanel<T extends Panel>(panel: T): T {
        this.rootElement.addChild(panel)
        this.panels.push(panel)
        return panel
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        const [cx, cy] = [event.canvasX, event.canvasY]
        const [sx, sy] = [cx / (this.canvas.width / SPRITE_RESOLUTION_WIDTH), cy / (this.canvas.height / SPRITE_RESOLUTION_HEIGHT)]
            .map((c) => Math.round(c))
        const hit = this.context && this.context.getImageData(cx, cy, 1, 1).data[3] > 0
        if (hit) {
            this.publishEvent(new ChangeCursor(Cursor.Pointer_Standard)) // TODO don't spam so many events?!
            if (event.eventEnum === POINTER_EVENT.MOVE) {
                this.rootElement.checkHover(sx, sy)
            } else if (event.eventEnum === POINTER_EVENT.DOWN) {
                this.rootElement.checkClick(sx, sy, event.button)
            } else if (event.eventEnum === POINTER_EVENT.UP) {
                this.rootElement.checkRelease(sx, sy, event.button)
            }
        } else if (event.eventEnum === POINTER_EVENT.MOVE) {
            this.rootElement.release()
        }
        return hit
    }

    handleWheelEvent(event: GameWheelEvent): boolean {
        return !this.context || this.context.getImageData(event.canvasX, event.canvasY, 1, 1).data[3] > 0
    }

}
