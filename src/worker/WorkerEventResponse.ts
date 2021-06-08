import { WorkerMessageType } from './WorkerMessageType'
import { WorkerResponse } from './WorkerResponse'

export class WorkerEventResponse extends WorkerResponse {

    eventId: string
    eventConsumed: boolean

    constructor(eventId: string, eventConsumed: boolean) {
        super(WorkerMessageType.RESPONSE_EVENT)
        this.eventId = eventId
        this.eventConsumed = eventConsumed
    }

}
