import { ObjectiveImageCfg } from '../cfg/ObjectiveImageCfg'
import { OffscreenWorkerMessage } from '../worker/OffscreenWorkerMessage'

export class GuiWorkerMessage extends OffscreenWorkerMessage {
    objectiveText?: string = null
    objectiveBackImgCfg?: ObjectiveImageCfg = null
}
