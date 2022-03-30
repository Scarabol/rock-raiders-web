import { EventKey } from '../event/EventKeyEnum'
import { POINTER_EVENT } from '../event/EventTypeEnum'
import { GameEvent } from '../event/GameEvent'
import { GameKeyboardEvent } from '../event/GameKeyboardEvent'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { GameWheelEvent } from '../event/GameWheelEvent'
import { ChangeCursor, LocalEvent } from '../event/LocalEvents'
import { NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../params'
import { AnimationFrameScaled } from '../screen/AnimationFrame'
import { OffscreenSystem } from '../worker/OffscreenSystem'
import { BaseElement } from './base/BaseElement'
import { Panel } from './base/Panel'
import { GuiClickEvent, GuiHoverEvent, GuiReleaseEvent } from './event/GuiEvent'

export abstract class AbstractGuiSystem extends OffscreenSystem {
    animationFrame: AnimationFrameScaled
    rootElement: BaseElement = new BaseElement(null)
    panels: Panel[] = []

    onCacheReady() {
        this.animationFrame = new AnimationFrameScaled(this.canvas)
        this.animationFrame.scale(this.canvas.width / NATIVE_SCREEN_WIDTH, this.canvas.height / NATIVE_SCREEN_HEIGHT)
        this.animationFrame.onRedraw = (context) => {
            context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            this.rootElement.onRedraw(context)
        }
        this.rootElement.notifyRedraw = () => this.animationFrame.redraw()
        this.rootElement.publishEvent = (event: LocalEvent) => {
            this.publishEvent(event)
        }
        this.rootElement.registerEventListener = (eventKey: EventKey, callback: (event: GameEvent) => any) => {
            this.registerEventListener(eventKey, callback)
        }
        this.animationFrame.redraw()
    }

    resizeCanvas(width: number, height: number) {
        super.resizeCanvas(width, height)
        this.animationFrame.scale(this.canvas.width / NATIVE_SCREEN_WIDTH, this.canvas.height / NATIVE_SCREEN_HEIGHT)
        this.animationFrame.redraw()
    }

    reset(): void {
        this.rootElement.reset()
        this.panels.forEach((p) => p.reset())
    }

    addPanel<T extends Panel>(panel: T): T {
        this.rootElement.addChild(panel)
        this.panels.push(panel)
        return panel
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        const context = this.animationFrame?.context
        if (!context) return false
        const [cx, cy] = [event.canvasX, event.canvasY]
        const [sx, sy] = [cx / (this.canvas.width / NATIVE_SCREEN_WIDTH), cy / (this.canvas.height / NATIVE_SCREEN_HEIGHT)]
            .map((c) => Math.round(c))
        const hit = context.getImageData(cx, cy, 1, 1).data[3] > 0
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

    handleKeyEvent(event: GameKeyboardEvent): boolean {
        return false
    }

    handleWheelEvent(event: GameWheelEvent): boolean {
        const context = this.animationFrame?.context
        return context && context.getImageData(event.canvasX, event.canvasY, 1, 1).data[3] > 0
    }
}
