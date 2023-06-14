import { ObjectiveImageCfg } from '../../cfg/LevelsCfg'
import { GuiWorkerMessage } from '../../gui/GuiWorkerMessage'
import { WorkerMessageType } from '../../resource/wadworker/WorkerMessageType'
import { OffscreenWorkerMessage } from '../../worker/OffscreenWorkerMessage'
import { TypedWorker, TypedWorkerFallback, TypedWorkerFrontend } from '../../worker/TypedWorker'
import { WorkerResponse } from '../../worker/WorkerResponse'
import { OffscreenLayer } from './OffscreenLayer'
import { OverlayWorker } from '../../worker/OverlayWorker'

export class OverlayLayer extends OffscreenLayer {
    onSetSpaceToContinue: (state: boolean) => any = (state: boolean) => console.log(`set space to continue: ${state}`)
    onAbortGame: () => any = () => console.log('abort the game')
    onRestartGame: () => any = () => console.log('restart the game')

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
