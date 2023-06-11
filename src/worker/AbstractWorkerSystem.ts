import { TypedWorkerBackend, WorkerRequestMessage, WorkerResponseMessage } from './TypedWorker'

export abstract class AbstractWorkerSystem<M, R> {
    constructor(readonly worker: TypedWorkerBackend<WorkerRequestMessage<M>, WorkerResponseMessage<R>>) {
        worker.onMessageFromFrontend = (msg) => {
            this.onMessageFromFrontend(msg.workerRequestId, msg.request)
        }
    }

    abstract onMessageFromFrontend(workerRequestId: number, request: M): void

    sendResponse(workerRequestId: number, response: R, transfer?: Transferable[]) {
        this.worker.sendResponse({workerRequestId: workerRequestId, response: response}, transfer)
    }
}
