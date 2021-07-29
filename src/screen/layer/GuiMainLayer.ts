import { WorkerMessageType } from '../../resource/wadworker/WorkerMessageType'
import { OffscreenLayer } from './OffscreenLayer'

export class GuiMainLayer extends OffscreenLayer {
    onOptionsShow: () => any = () => console.log('Show options triggered')

    constructor() {
        super(new Worker(new URL('../../gui/GuiMainWorker', import.meta.url))) // webpack does not allow to extract the URL
    }

    onMessage(msg): boolean {
        if (msg.type === WorkerMessageType.SHOW_OPTIONS) {
            this.onOptionsShow()
        } else {
            return false
        }
        return true
    }

    setSpaceToContinue(state: boolean) {
        this.sendMessage({type: WorkerMessageType.SPACE_TO_CONINUE, messageState: state})
    }
}
