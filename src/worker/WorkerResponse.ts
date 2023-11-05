import { WorkerMessageType } from './WorkerMessageType'

export class WorkerResponse {
    type: WorkerMessageType

    constructor(type: WorkerMessageType) {
        this.type = type
    }
}
