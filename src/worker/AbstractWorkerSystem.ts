import { TypedWorkerBackend, WorkerRequestMessage, WorkerResponseMessage } from './TypedWorker'

export abstract class AbstractWorkerSystem<M, R> {
    constructor(readonly worker: TypedWorkerBackend<WorkerRequestMessage<M>, WorkerResponseMessage<R>>) {
        worker.onMessageFromFrontend = (msg) => {
            try {
                this.onMessageFromFrontend(msg.workerRequestHash, msg.request)
            } catch (e) {
                console.error(e)
                this.worker.sendResponse({workerRequestHash: msg.workerRequestHash, response: null}) // XXX improve error handling
            }
        }
    }

    abstract onMessageFromFrontend(workerRequestHash: string, request: M): void

    sendResponse(workerRequestHash: string, response: R, transfer?: Transferable[]) {
        this.worker.sendResponse({workerRequestHash: workerRequestHash, response: response}, transfer)
    }
}
