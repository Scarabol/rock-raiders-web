import { WorkerMessageType } from '../../resource/wadworker/WorkerMessageType'
import { WorkerResponse } from '../../worker/WorkerResponse'
import { OffscreenLayer, OffscreenLayerWorker } from './OffscreenLayer'

export class GuiMainLayer extends OffscreenLayer {
    onOptionsShow: () => any = () => console.log('Show options triggered')

    createOffscreenWorker(): OffscreenLayerWorker {
        return new Worker(new URL('../../worker/GuiMainWorker', import.meta.url)) // webpack does not allow to extract the URL
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
