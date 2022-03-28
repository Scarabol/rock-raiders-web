import { EventKey } from '../event/EventKeyEnum'
import { GameEvent } from '../event/GameEvent'
import { GameKeyboardEvent } from '../event/GameKeyboardEvent'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { GameWheelEvent } from '../event/GameWheelEvent'
import { IEventHandler } from '../event/IEventHandler'
import { OffscreenCache } from './OffscreenCache'
import { WorkerMessageType } from '../resource/wadworker/WorkerMessageType'
import { OffscreenWorkerMessage } from './OffscreenWorkerMessage'
import { WorkerEventResponse } from './WorkerEventResponse'
import { WorkerPublishEvent } from './WorkerPublishEvent'
import { WorkerResponse } from './WorkerResponse'

export abstract class OffscreenSystem implements IEventHandler {
    readonly eventListener = new Map<EventKey, ((event: GameEvent) => any)[]>()
    canvas: HTMLCanvasElement | OffscreenCanvas = null

    constructor(readonly worker: Worker) {
        worker.addEventListener('message', (event) => this.processMessage(event.data))
    }

    abstract onCacheReady(): any

    handlePointerEvent(event: GamePointerEvent): boolean {
        return false
    }

    handleKeyEvent(event: GameKeyboardEvent): boolean {
        return false
    }

    handleWheelEvent(event: GameWheelEvent): boolean {
        return false
    }

    abstract onProcessMessage(msg: OffscreenWorkerMessage): boolean

    resizeCanvas(width: number, height: number) {
        this.canvas.width = width
        this.canvas.height = height
    }

    abstract reset(): void

    processMessage(msg: OffscreenWorkerMessage): void {
        if (msg.type === WorkerMessageType.INIT) {
            this.canvas = msg.canvas
            OffscreenCache.resourceByName = msg.resourceByName
            OffscreenCache.configuration = msg.cfg
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
            console.warn(`Worker ignores message of type: ${WorkerMessageType[msg.type]}`)
        }
    }

    sendResponse(response: WorkerResponse) {
        this.worker.postMessage(response)
    }

    sendEventResponse(response: WorkerEventResponse) {
        this.sendResponse(response)
    }

    publishEvent(event: GameEvent): void {
        this.sendResponse(new WorkerPublishEvent(event))
    }

    registerEventListener(eventKey: EventKey, callback: (event: GameEvent) => any): void {
        this.eventListener.getOrUpdate(eventKey, () => []).push(callback)
    }
}
