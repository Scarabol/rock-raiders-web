import { TypedWorkerBackend, WorkerRequestMessage, WorkerResponseMessage } from './TypedWorker'

export abstract class AbstractWorkerSystem<M, R> {
    constructor(readonly worker: TypedWorkerBackend<WorkerRequestMessage<M>, WorkerResponseMessage<R>>) {
        worker.onMessageFromFrontend = (msg) => {
            const response = this.onMessageFromFrontend(msg.request)
            if (response) this.worker.sendResponse({workerRequestId: msg.workerRequestId, response: response})
        }
    }

    abstract onMessageFromFrontend(request: M): R
}
