import { GuiMainSystem } from '../../gui/GuiMainSystem'
import { WorkerMessageType } from '../../resource/wadworker/WorkerMessageType'
import { OffscreenFallbackWorker, OffscreenWorker, OffscreenWorkerFrontend } from '../../worker/OffscreenWorker'
import { WorkerResponse } from '../../worker/WorkerResponse'
import { OffscreenLayer } from './OffscreenLayer'

export class GuiMainLayer extends OffscreenLayer {
    onOptionsShow: () => any = () => console.log('Show options triggered')

    createOffscreenWorker(): OffscreenWorker {
        const worker = new Worker(new URL('../../worker/GuiMainWorker', import.meta.url)) // webpack does not allow to extract the URL
        return new OffscreenWorkerFrontend(worker, (response) => this.onResponseFromWorker(response))
    }

    createFallbackWorker(): OffscreenWorker {
        const worker = new OffscreenFallbackWorker()
        worker.onResponseFromWorker = (response) => this.onResponseFromWorker(response)
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
