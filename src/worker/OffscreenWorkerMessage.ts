import { WorkerMessageType } from '../resource/wadworker/WorkerMessageType'

export class OffscreenWorkerMessage {

    type: WorkerMessageType

    constructor(type: WorkerMessageType) {
        this.type = type
    }

}
