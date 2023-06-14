import { EventBus } from '../../event/EventBus'
import { ToggleAlarmEvent } from '../../event/WorldEvents'
import { GuiMainWorker } from '../../worker/GuiMainWorker'
import { WorkerMessageType } from '../../resource/wadworker/WorkerMessageType'
import { OffscreenWorkerMessage } from '../../worker/OffscreenWorkerMessage'
import { TypedWorker, TypedWorkerFallback, TypedWorkerFrontend } from '../../worker/TypedWorker'
import { WorkerResponse } from '../../worker/WorkerResponse'
import { OffscreenLayer } from './OffscreenLayer'

export class GuiMainLayer extends OffscreenLayer {
    onOptionsShow: () => any = () => console.log('Show options triggered')

    createOffscreenWorker(): TypedWorker<OffscreenWorkerMessage, WorkerResponse> {
        const worker = new Worker(new URL('../../worker/GuiMainWorker', import.meta.url), {type: 'module'})
        return new TypedWorkerFrontend(worker, (r: WorkerResponse) => this.onResponseFromWorker(r))
    }

    createFallbackWorker(): TypedWorker<OffscreenWorkerMessage, WorkerResponse> {
        const worker = new TypedWorkerFallback((r: WorkerResponse) => this.onResponseFromWorker(r))
        new GuiMainWorker(worker)
        return worker
    }

    onMessage(msg: WorkerResponse): boolean {
        if (msg.type === WorkerMessageType.TOGGLE_ALARM) {
            EventBus.publishEvent(new ToggleAlarmEvent(msg.messageState))
        } else if (msg.type === WorkerMessageType.SHOW_OPTIONS) {
            this.onOptionsShow()
        } else {
            return false
        }
        return true
    }

    setSpaceToContinue(state: boolean) {
        this.sendMessage({type: WorkerMessageType.SPACE_TO_CONTINUE, messageState: state})
    }
}
