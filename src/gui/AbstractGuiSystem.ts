import { EventKey } from '../event/EventKeyEnum'
import { POINTER_EVENT } from '../event/EventTypeEnum'
import { GameEvent } from '../event/GameEvent'
import { GameKeyboardEvent } from '../event/GameKeyboardEvent'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { GameWheelEvent } from '../event/GameWheelEvent'
import { ChangeCursor, GuiCommand } from '../event/GuiCommand'
import { NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../params'
import { AnimationFrameScaled } from '../screen/AnimationFrame'
import { BaseElement } from './base/BaseElement'
import { Panel } from './base/Panel'
import { GuiClickEvent, GuiHoverEvent, GuiReleaseEvent } from './event/GuiEvent'
import { Cursor } from '../resource/Cursor'
import { OffscreenCache } from '../worker/OffscreenCache'
import { TypedWorkerBackend } from '../worker/TypedWorker'
import { OffscreenWorkerMessage } from '../worker/OffscreenWorkerMessage'
import { WorkerResponse } from '../worker/WorkerResponse'
import { WorkerMessageType } from '../resource/wadworker/WorkerMessageType'
import { WorkerEventResponse } from '../worker/WorkerEventResponse'
import { WorkerPublishEvent } from '../worker/WorkerPublishEvent'

export abstract class AbstractGuiSystem {
    readonly eventListener = new Map<EventKey, ((event: GameEvent) => any)[]>()
    canvas: HTMLCanvasElement | OffscreenCanvas = null
    animationFrame: AnimationFrameScaled
    rootElement: BaseElement = new BaseElement(null)
    panels: Panel[] = []

    constructor(readonly worker: TypedWorkerBackend<OffscreenWorkerMessage, WorkerResponse>) {
        this.worker.onMessageFromFrontend = (msg) => this.processMessage(msg)
    }

    onCacheReady() {
        this.animationFrame = new AnimationFrameScaled(this.canvas)
        this.animationFrame.scale(this.canvas.width / NATIVE_SCREEN_WIDTH, this.canvas.height / NATIVE_SCREEN_HEIGHT)
        this.animationFrame.onRedraw = (context) => {
            context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            this.rootElement.onRedraw(context)
        }
        this.rootElement.notifyRedraw = () => this.animationFrame.notifyRedraw()
        this.rootElement.publishEvent = (event: GuiCommand) => {
            this.publishEvent(event)
        }
        this.rootElement.registerEventListener = (eventKey: EventKey, callback: (event: GameEvent) => any) => {
            this.registerEventListener(eventKey, callback)
        }
        this.animationFrame.notifyRedraw()
        OffscreenCache.startBitmapFontRenderPool()
    }

    resizeCanvas(width: number, height: number) {
        this.canvas.width = width
        this.canvas.height = height
        this.animationFrame.scale(this.canvas.width / NATIVE_SCREEN_WIDTH, this.canvas.height / NATIVE_SCREEN_HEIGHT)
        this.animationFrame.notifyRedraw()
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
            this.publishEvent(new ChangeCursor(Cursor.STANDARD)) // TODO don't spam so many events?!
            if (event.eventEnum === POINTER_EVENT.MOVE) {
                this.rootElement.checkHover(new GuiHoverEvent(sx, sy))
            } else if (event.eventEnum === POINTER_EVENT.DOWN) {
                this.rootElement.checkClick(new GuiClickEvent(sx, sy, event.button))
            } else if (event.eventEnum === POINTER_EVENT.UP) {
                this.rootElement.checkRelease(new GuiReleaseEvent(sx, sy, event.button))
            }
        } else if (event.eventEnum === POINTER_EVENT.MOVE || event.eventEnum === POINTER_EVENT.LEAVE) {
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

    processMessage(msg: OffscreenWorkerMessage): void {
        if (msg.type === WorkerMessageType.INIT) {
            this.canvas = msg.canvas
            OffscreenCache.resourceByName = msg.resourceByName
            OffscreenCache.configuration = msg.cfg
            OffscreenCache.offscreenPreferences = msg.currentPreferences
            this.onCacheReady()
        } else if (msg.type === WorkerMessageType.RESIZE) {
            this.resizeCanvas(msg.canvasWidth, msg.canvasHeight)
        } else if (msg.type === WorkerMessageType.EVENT_POINTER) {
            const consumed = this.handlePointerEvent(msg.inputEvent as GamePointerEvent)
            this.sendEventResponse({
                type: WorkerMessageType.RESPONSE_EVENT,
                eventId: msg.eventId,
                eventConsumed: consumed,
            })
        } else if (msg.type === WorkerMessageType.EVENT_KEY) {
            const consumed = this.handleKeyEvent(msg.inputEvent as GameKeyboardEvent)
            this.sendEventResponse({
                type: WorkerMessageType.RESPONSE_EVENT,
                eventId: msg.eventId,
                eventConsumed: consumed,
            })
        } else if (msg.type === WorkerMessageType.EVENT_WHEEL) {
            const consumed = this.handleWheelEvent(msg.inputEvent as GameWheelEvent)
            this.sendEventResponse({
                type: WorkerMessageType.RESPONSE_EVENT,
                eventId: msg.eventId,
                eventConsumed: consumed,
            })
        } else if (msg.type === WorkerMessageType.RESET) {
            this.reset()
        } else if (msg.type === WorkerMessageType.GAME_EVENT) {
            const event = msg.gameEvent
            this.eventListener.getOrUpdate(event.eventKey, () => []).forEach((callback) => callback(event))
        } else if (!this.onProcessMessage(msg)) {
            console.warn(`Worker (${this.constructor.name}) ignores message of type: ${WorkerMessageType[msg.type]}`)
        }
    }

    abstract onProcessMessage(msg: OffscreenWorkerMessage): boolean

    sendResponse(response: WorkerResponse) {
        this.worker.sendResponse(response)
    }

    sendEventResponse(response: WorkerEventResponse) {
        this.sendResponse(response)
    }

    publishEvent(event: GuiCommand): void {
        this.sendResponse(new WorkerPublishEvent(event))
    }

    registerEventListener(eventKey: EventKey, callback: (event: GameEvent) => any): void {
        this.eventListener.getOrUpdate(eventKey, () => []).push(callback)
    }
}
