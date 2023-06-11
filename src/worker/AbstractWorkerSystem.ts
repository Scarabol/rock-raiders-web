import { TypedWorkerBackend, WorkerRequestMessage, WorkerResponseMessage } from './TypedWorker'

export abstract class AbstractWorkerSystem<M, R> {
    constructor(readonly worker: TypedWorkerBackend<WorkerRequestMessage<M>, WorkerResponseMessage<R>>) {
        worker.onMessageFromFrontend = (msg) => {
            this.onMessageFromFrontend(msg.workerRequestHash, msg.request)
        }
    }

    abstract onMessageFromFrontend(workerRequestHash: string, request: M): void

    sendResponse(workerRequestHash: string, response: R, transfer?: Transferable[]) {
        this.worker.sendResponse({workerRequestHash: workerRequestHash, response: response}, transfer)
    }
}
