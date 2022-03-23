import { cancelAnimationFrameSafe } from '../core/Util'
import { EventKey } from '../event/EventKeyEnum'
import { POINTER_EVENT } from '../event/EventTypeEnum'
import { GameEvent } from '../event/GameEvent'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { GameWheelEvent } from '../event/GameWheelEvent'
import { ChangeCursor, LocalEvent } from '../event/LocalEvents'
import { NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../params'
import { OffscreenWorker } from '../worker/OffscreenWorker'
import { BaseElement } from './base/BaseElement'
import { Panel } from './base/Panel'
import { GuiClickEvent, GuiHoverEvent, GuiReleaseEvent } from './event/GuiEvent'

export abstract class GuiWorker extends OffscreenWorker {
    lastAnimationRequest: number
    rootElement: BaseElement = new BaseElement(null)
    panels: Panel[] = []

    onCacheReady() {
        this.rootElement.notifyRedraw = () => this.redraw()
        this.rootElement.publishEvent = (event: LocalEvent) => {
            this.publishEvent(event)
        }
        this.rootElement.registerEventListener = (eventKey: EventKey, callback: (event: GameEvent) => any) => {
            this.registerEventListener(eventKey, callback)
        }
    }

    redraw() {
        cancelAnimationFrameSafe(this.lastAnimationRequest)
        this.lastAnimationRequest = requestAnimationFrame(() => {
            super.redraw()
            this.rootElement.onRedraw(this.context)
        })
    }

    reset(): void {
        this.panels.forEach((p) => p.reset())
    }

    addPanel<T extends Panel>(panel: T): T {
        this.rootElement.addChild(panel)
        this.panels.push(panel)
        return panel
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        const [cx, cy] = [event.canvasX, event.canvasY]
        const [sx, sy] = [cx / (this.canvas.width / NATIVE_SCREEN_WIDTH), cy / (this.canvas.height / NATIVE_SCREEN_HEIGHT)]
            .map((c) => Math.round(c))
        const hit = this.context && this.context.getImageData(cx, cy, 1, 1).data[3] > 0
        if (hit) {
            this.publishEvent(new ChangeCursor('pointerStandard')) // TODO don't spam so many events?!
            if (event.eventEnum === POINTER_EVENT.MOVE) {
                this.rootElement.checkHover(new GuiHoverEvent(sx, sy))
            } else if (event.eventEnum === POINTER_EVENT.DOWN) {
                this.rootElement.checkClick(new GuiClickEvent(sx, sy, event.button))
            } else if (event.eventEnum === POINTER_EVENT.UP) {
                this.rootElement.checkRelease(new GuiReleaseEvent(sx, sy, event.button))
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
