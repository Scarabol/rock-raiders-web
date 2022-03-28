import { ObjectiveImageCfg } from '../../cfg/LevelsCfg'
import { GuiWorkerMessage } from '../../gui/GuiWorkerMessage'
import { WorkerMessageType } from '../../resource/wadworker/WorkerMessageType'
import { WorkerResponse } from '../../worker/WorkerResponse'
import { OffscreenLayer } from './OffscreenLayer'
import { OffscreenWorker, OffscreenWorkerFrontend } from '../../worker/OffscreenWorker'

export class OverlayLayer extends OffscreenLayer {
    onSetSpaceToContinue: (state: boolean) => any = (state: boolean) => console.log(`set space to continue: ${state}`)
    onAbortGame: () => any = () => console.log('abort the game')
    onRestartGame: () => any = () => console.log('restart the game')

    createOffscreenWorker(): OffscreenWorker {
        const worker = new Worker(new URL('../../worker/OverlayWorker', import.meta.url)) // webpack does not allow to extract the URL
        return new OffscreenWorkerFrontend(worker, (response) => this.onResponseFromWorker(response))
    }

    onMessage(msg: WorkerResponse): boolean {
        if (msg.type === WorkerMessageType.SPACE_TO_CONTINUE) {
            this.onSetSpaceToContinue(msg.messageState)
        } else if (msg.type === WorkerMessageType.GAME_ABORT) {
            this.onAbortGame()
        } else if (msg.type === WorkerMessageType.GAME_RESTART) {
            this.onRestartGame()
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

    protected sendMessage(message: GuiWorkerMessage, transfer?: Transferable[]) {
        super.sendMessage(message, transfer)
    }

    showOptions() {
        this.sendMessage({type: WorkerMessageType.SHOW_OPTIONS})
    }
}
