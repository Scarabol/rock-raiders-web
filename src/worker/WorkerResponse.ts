import { WorkerMessageType } from '../resource/wadworker/WorkerMessageType'

export class WorkerResponse {

    type: WorkerMessageType
    messageState?: boolean = null

    constructor(type: WorkerMessageType) {
        this.type = type
    }

}
