import { GameEvent } from '../event/GameEvent'
import { GameKeyboardEvent } from '../event/GameKeyboardEvent'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { GameWheelEvent } from '../event/GameWheelEvent'
import { WorkerMessageType } from '../resource/wadworker/WorkerMessageType'

export class OffscreenWorkerMessage {

    type: WorkerMessageType
    cfg?: any
    stats?: any
    resourceByName?: Map<string, any>
    messageState?: boolean
    canvas?: OffscreenCanvas = null
    eventId?: string = null
    inputEvent?: GamePointerEvent | GameKeyboardEvent | GameWheelEvent = null
    gameEvent?: GameEvent

    constructor(type: WorkerMessageType) {
        this.type = type
    }

}
