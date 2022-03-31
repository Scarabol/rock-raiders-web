import { GuiMainSystem } from '../../gui/GuiMainSystem'
import { WorkerMessageType } from '../../resource/wadworker/WorkerMessageType'
import { OffscreenWorkerMessage } from '../../worker/OffscreenWorkerMessage'
import { TypedWorker, TypedWorkerFallback, TypedWorkerFrontend } from '../../worker/TypedWorker'
import { WorkerResponse } from '../../worker/WorkerResponse'
import { OffscreenLayer } from './OffscreenLayer'

export class GuiMainLayer extends OffscreenLayer {
    onOptionsShow: () => any = () => console.log('Show options triggered')

    createOffscreenWorker(): TypedWorker<OffscreenWorkerMessage> {
        const worker = new Worker(new URL('../../worker/GuiMainWorker', import.meta.url)) // webpack does not allow to extract the URL
        return new TypedWorkerFrontend(worker, (r) => this.onResponseFromWorker(r))
    }

    createFallbackWorker(): TypedWorker<OffscreenWorkerMessage> {
        const worker = new TypedWorkerFallback((r) => this.onResponseFromWorker(r))
        new GuiMainSystem(worker)
        return worker
    }

    onMessage(msg: WorkerResponse): boolean {
        if (msg.type === WorkerMessageType.SHOW_OPTIONS) {
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
