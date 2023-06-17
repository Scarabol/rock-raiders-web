import { ObjectiveImageCfg } from '../cfg/LevelsCfg'
import { OffscreenWorkerMessage } from '../worker/OffscreenWorkerMessage'

export class OverlayWorkerMessage extends OffscreenWorkerMessage {
    objectiveText?: string = null
    objectiveBackImgCfg?: ObjectiveImageCfg = null
}
