import { MathUtils } from 'three'
import { SoundManager } from '../../audio/SoundManager'
import { EventBus } from '../../event/EventBus'
import { EventKey } from '../../event/EventKeyEnum'
import { GameEvent } from '../../event/GameEvent'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { GameWheelEvent } from '../../event/GameWheelEvent'
import { BuildingsChangedEvent, PlaySoundEvent, RaidersAmountChangedEvent } from '../../event/LocalEvents'
import { MaterialAmountChanged } from '../../event/WorldEvents'
import { EntityManager } from '../../game/EntityManager'
import { ResourceManager } from '../../resource/ResourceManager'
import { WorkerMessageType } from '../../resource/wadworker/WorkerMessageType'
import { OffscreenWorkerMessage } from '../../worker/OffscreenWorkerMessage'
import { WorkerEventResponse } from '../../worker/WorkerEventResponse'
import { WorkerPublishEvent } from '../../worker/WorkerPublishEvent'
import { WorkerResponse } from '../../worker/WorkerResponse'
import { ScreenLayer } from './ScreenLayer'
import { OffscreenWorker } from '../../worker/OffscreenWorker'
import generateUUID = MathUtils.generateUUID

export abstract class OffscreenLayer extends ScreenLayer {
    readonly resolveCallbackByEventId: Map<string, ((consumed: boolean) => any)> = new Map()
    worker: OffscreenWorker
    entityMgr: EntityManager

    constructor() {
        super()
        this.initWorker()
        EventBus.registerWorkerListener((event: GameEvent) => {
            if (!event.guiForward) return
            try {
                this.sendMessage({type: WorkerMessageType.GAME_EVENT, gameEvent: event})
            } catch (e) {
                console.warn('Could not send event to GUI worker: ', e, event)
            }
        })
    }

    private initWorker() {
        const msgInit = {
            type: WorkerMessageType.INIT,
            canvas: this.canvas as HTMLCanvasElement | OffscreenCanvas,
            resourceByName: ResourceManager.resourceByName,
            cfg: ResourceManager.configuration,
        }
        if ('transferControlToOffscreen' in this.canvas) {
            this.worker = this.createOffscreenWorker()
            msgInit.canvas = this.canvas.transferControlToOffscreen()
            this.sendMessage(msgInit, [msgInit.canvas])
        } else {
            console.warn('Your Browser does not support WebGL in workers!\nUsing fallback to main thread, which might have bad performance.\nTo solve this issue for Firefox set gfx.offscreencanvas.enabled to true in about:config or use https://www.chromium.org/')
            this.worker = this.createFallbackWorker()
            this.sendMessage(msgInit)
        }
    }

    protected onResponseFromWorker(response: WorkerResponse) {
        if (response.type === WorkerMessageType.RESPONSE_EVENT) {
            const eventResponse = response as WorkerEventResponse
            const resolve = this.resolveCallbackByEventId.get(eventResponse.eventId)
            resolve(eventResponse.eventConsumed)
            this.resolveCallbackByEventId.delete(eventResponse.eventId)
        } else if (response.type === WorkerMessageType.GAME_EVENT) {
            const event = (response as WorkerPublishEvent).gameEvent
            if (event.eventKey === EventKey.PLAY_SOUND) {
                SoundManager.playSample((event as PlaySoundEvent).sample)
            }
            EventBus.publishEvent(event)
        } else if (!this.onMessage(response)) {
            console.warn(`Offscreen layer ignored message: ${WorkerMessageType[response.type]}`)
        }
    }

    abstract createOffscreenWorker(): OffscreenWorker

    abstract createFallbackWorker(): OffscreenWorker

    abstract onMessage(msg: WorkerResponse): boolean

    protected sendMessage(message: OffscreenWorkerMessage, transfer?: (Transferable | OffscreenCanvas)[]) {
        this.worker.sendMessage(message, transfer)
    }

    reset() {
        this.sendMessage({type: WorkerMessageType.RESET})
        this.sendMessage({type: WorkerMessageType.GAME_EVENT, gameEvent: new BuildingsChangedEvent(this.entityMgr)})
        this.sendMessage({type: WorkerMessageType.GAME_EVENT, gameEvent: new RaidersAmountChangedEvent(this.entityMgr)})
        this.sendMessage({type: WorkerMessageType.GAME_EVENT, gameEvent: new MaterialAmountChanged()})
    }

    resize(width: number, height: number) {
        this.sendMessage({
            type: WorkerMessageType.RESIZE,
            canvasWidth: width,
            canvasHeight: height,
        })
    }

    pushPointerEvent(event: GamePointerEvent): Promise<boolean> {
        [event.canvasX, event.canvasY] = this.toCanvasCoords(event.clientX, event.clientY)
        return this.sendEventMessage(WorkerMessageType.EVENT_POINTER, event)
    }

    pushKeyEvent(event: GameKeyboardEvent): Promise<boolean> {
        return this.sendEventMessage(WorkerMessageType.EVENT_KEY, event)
    }

    pushWheelEvent(event: GameWheelEvent): Promise<boolean> {
        [event.canvasX, event.canvasY] = this.toCanvasCoords(event.clientX, event.clientY)
        return this.sendEventMessage(WorkerMessageType.EVENT_WHEEL, event)
    }

    private sendEventMessage(type: WorkerMessageType, event: GamePointerEvent | GameKeyboardEvent | GameWheelEvent): Promise<boolean> {
        const eventId = generateUUID()
        this.sendMessage({
            type: type,
            eventId: eventId,
            inputEvent: event,
        })
        return new Promise((resolve) => this.resolveCallbackByEventId.set(eventId, resolve))
    }
}
