import { WorkerMessageType } from '../../resource/wadworker/WorkerMessageType'
import { WorkerResponse } from '../../worker/WorkerResponse'
import { OffscreenLayer } from './OffscreenLayer'
import { OffscreenWorker, OffscreenWorkerFrontend } from '../../worker/OffscreenWorker'

export class GuiMainLayer extends OffscreenLayer {
    onOptionsShow: () => any = () => console.log('Show options triggered')

    createOffscreenWorker(): OffscreenWorker {
        const worker = new Worker(new URL('../../worker/GuiMainWorker', import.meta.url)) // webpack does not allow to extract the URL
        return new OffscreenWorkerFrontend(worker, (response) => this.onResponseFromWorker(response))
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
