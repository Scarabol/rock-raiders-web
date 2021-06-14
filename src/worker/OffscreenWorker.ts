import { EventKey } from '../event/EventKeyEnum'
import { GameEvent } from '../event/GameEvent'
import { GameKeyboardEvent } from '../event/GameKeyboardEvent'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { GameWheelEvent } from '../event/GameWheelEvent'
import { IEventHandler } from '../event/IEventHandler'
import { GuiResourceCache } from '../gui/GuiResourceCache'
import { SPRITE_RESOLUTION_HEIGHT, SPRITE_RESOLUTION_WIDTH } from '../params'
import { WorkerMessageType } from '../resource/wadworker/WorkerMessageType'
import { OffscreenWorkerMessage } from './OffscreenWorkerMessage'
import { WorkerEventResponse } from './WorkerEventResponse'
import { WorkerPublishEvent } from './WorkerPublishEvent'
import { WorkerResponse } from './WorkerResponse'

export abstract class OffscreenWorker implements IEventHandler {

    worker: Worker

    canvas: OffscreenCanvas = null
    context: OffscreenCanvasRenderingContext2D = null

    eventListener = new Map<EventKey, ((event: GameEvent) => any)[]>()

    protected constructor(worker: Worker) {
        this.worker = worker
    }

    redraw() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

    abstract reset()

    abstract init()

    setCanvas(canvas: OffscreenCanvas) {
        this.canvas = canvas
        this.context = canvas.getContext('2d')
        this.context.scale(this.canvas.width / SPRITE_RESOLUTION_WIDTH, this.canvas.height / SPRITE_RESOLUTION_HEIGHT)
        this.redraw()
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        return false
    }

    handleKeyEvent(event: GameKeyboardEvent): boolean {
        return false
    }

    handleWheelEvent(event: GameWheelEvent): boolean {
        return false
    }

    sendResponse(response: WorkerResponse) {
        this.worker.postMessage(response)
    }

    sendEventResponse(response: WorkerEventResponse) {
        this.sendResponse(response)
    }

    processMessage(msg: OffscreenWorkerMessage) {
        if (msg.type === WorkerMessageType.INIT) {
            GuiResourceCache.resourceByName = msg.resourceByName
            GuiResourceCache.configuration = msg.cfg
            GuiResourceCache.stats = msg.stats
            this.init()
        } else if (msg.type === WorkerMessageType.CANVAS) {
            this.setCanvas(msg.canvas)
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
        } else if (msg.type === WorkerMessageType.REDRAW) {
            this.redraw()
        } else if (msg.type === WorkerMessageType.GAME_EVENT) {
            const event = msg.gameEvent
            this.eventListener.getOrUpdate(event.eventKey, () => []).forEach((callback) => callback(event))
        } else if (!this.onProcessMessage(msg)) {
            console.warn('Worker ignores message of type: ' + WorkerMessageType[msg.type])
        }
        return true
    }

    publishEvent(event: GameEvent): void {
        this.sendResponse(new WorkerPublishEvent(event))
    }

    registerEventListener(eventKey: EventKey, callback: (GameEvent) => any): void {
        this.eventListener.getOrUpdate(eventKey, () => []).push(callback)
    }

    abstract onProcessMessage(msg: OffscreenWorkerMessage): boolean

}
