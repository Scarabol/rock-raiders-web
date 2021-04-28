import { ObjectiveImageCfg } from '../cfg/ObjectiveImageCfg'
import { GameEvent } from '../event/GameEvent'
import { GameKeyboardEvent } from '../event/GameKeyboardEvent'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { GameWheelEvent } from '../event/GameWheelEvent'
import { WadWorkerMessage } from '../resource/wadworker/WadWorkerMessage'

export class GuiWorkerMessage extends WadWorkerMessage {

    canvas?: OffscreenCanvas = null
    objectiveText?: string = null
    objectiveBackImgCfg?: ObjectiveImageCfg = null
    eventId?: string = null
    inputEvent?: GamePointerEvent | GameKeyboardEvent | GameWheelEvent = null
    gameEvent?: GameEvent

}
