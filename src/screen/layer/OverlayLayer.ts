import { ObjectiveImageCfg } from '../../cfg/LevelsCfg'
import { OverlayWorkerMessage } from '../../gui/OverlayWorkerMessage'
import { WorkerMessageType } from '../../resource/wadworker/WorkerMessageType'
import { OffscreenWorkerMessage } from '../../worker/OffscreenWorkerMessage'
import { TypedWorker, TypedWorkerFallback, TypedWorkerFrontend } from '../../worker/TypedWorker'
import { WorkerResponse } from '../../worker/WorkerResponse'
import { OffscreenLayer } from './OffscreenLayer'
import { OverlayWorker } from '../../worker/OverlayWorker'
import { EventBus } from '../../event/EventBus'
import { GameResultEvent, RestartGameEvent } from '../../event/WorldEvents'
import { GameResultState } from '../../game/model/GameResult'
import { EventKey } from '../../event/EventKeyEnum'
import { SetSpaceToContinueEvent } from '../../event/LocalEvents'

export class OverlayLayer extends OffscreenLayer {
    constructor() {
        super()
        EventBus.registerEventListener(EventKey.SHOW_OPTIONS, () => this.sendMessage({type: WorkerMessageType.SHOW_OPTIONS}))
    }

    createOffscreenWorker(): TypedWorker<OffscreenWorkerMessage, WorkerResponse> {
        const worker = new Worker(new URL('../../worker/OverlayWorker', import.meta.url), {type: 'module'})
        return new TypedWorkerFrontend(worker, (response: WorkerResponse) => this.onResponseFromWorker(response))
    }

    createFallbackWorker(): TypedWorker<OffscreenWorkerMessage, WorkerResponse> {
        const worker = new TypedWorkerFallback((r: WorkerResponse) => this.onResponseFromWorker(r))
        new OverlayWorker(worker)
        return worker
    }

    onMessage(msg: WorkerResponse): boolean {
        if (msg.type === WorkerMessageType.SPACE_TO_CONTINUE) {
            EventBus.publishEvent(new SetSpaceToContinueEvent(msg.messageState))
        } else if (msg.type === WorkerMessageType.GAME_ABORT) {
            EventBus.publishEvent(new GameResultEvent(GameResultState.QUIT))
        } else if (msg.type === WorkerMessageType.GAME_RESTART) {
            EventBus.publishEvent(new RestartGameEvent())
        } else {
            return false
        }
        return true
    }

    setup(objectiveText: string, objectiveBackImgCfg: ObjectiveImageCfg) {
        this.sendMessage({
            type: WorkerMessageType.OVERLAY_SETUP,
            objectiveText: objectiveText,
            objectiveBackImgCfg: objectiveBackImgCfg,
        })
    }

    protected sendMessage(message: OverlayWorkerMessage, transfer?: Transferable[]) {
        super.sendMessage(message, transfer)
    }
}
