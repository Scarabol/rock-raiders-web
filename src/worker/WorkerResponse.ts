import { WorkerMessageType } from '../resource/wadworker/WorkerMessageType'

export class WorkerResponse {
    type: WorkerMessageType

    constructor(type: WorkerMessageType) {
        this.type = type
    }
}
