import { GameEvent } from '../event/GameEvent'
import { WorkerMessageType } from '../resource/wadworker/WorkerMessageType'
import { WorkerResponse } from './WorkerResponse'

export class WorkerPublishEvent extends WorkerResponse {

    gameEvent: GameEvent

    constructor(gameEvent: GameEvent) {
        super(WorkerMessageType.GAME_EVENT)
        this.gameEvent = gameEvent
    }

}
