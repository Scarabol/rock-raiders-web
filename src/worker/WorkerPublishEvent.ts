import { GuiCommand } from '../event/GuiCommand'
import { WorkerMessageType } from '../resource/wadworker/WorkerMessageType'
import { WorkerResponse } from './WorkerResponse'

export class WorkerPublishEvent extends WorkerResponse {
    gameEvent: GuiCommand

    constructor(gameEvent: GuiCommand) {
        super(WorkerMessageType.GAME_EVENT)
        this.gameEvent = gameEvent
    }
}
