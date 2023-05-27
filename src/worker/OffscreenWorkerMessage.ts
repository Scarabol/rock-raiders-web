import { GameEvent } from '../event/GameEvent'
import { GameKeyboardEvent } from '../event/GameKeyboardEvent'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { GameWheelEvent } from '../event/GameWheelEvent'
import { WorkerMessageType } from '../resource/wadworker/WorkerMessageType'
import { SaveGamePreferences } from '../resource/SaveGameManager'

export class OffscreenWorkerMessage {
    cfg?: any = undefined
    stats?: any = undefined
    resourceByName?: Map<string, any> = undefined
    messageState?: boolean = undefined
    canvas?: HTMLCanvasElement | OffscreenCanvas = undefined
    canvasWidth?: number = undefined
    canvasHeight?: number = undefined
    eventId?: string = undefined
    inputEvent?: GamePointerEvent | GameKeyboardEvent | GameWheelEvent = undefined
    gameEvent?: GameEvent = undefined
    currentPreferences?: SaveGamePreferences = undefined

    constructor(readonly type: WorkerMessageType) {
    }
}
