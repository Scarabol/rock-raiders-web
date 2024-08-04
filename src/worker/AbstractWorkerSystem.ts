import { TypedWorkerBackend, WorkerRequestMessage, WorkerResponseMessage } from './TypedWorker'

export abstract class AbstractWorkerSystem<M, R> {
    constructor(readonly worker: TypedWorkerBackend<WorkerRequestMessage<M>, WorkerResponseMessage<R>>) {
        worker.onMessageFromFrontend = (msg) => {
            try {
                if (msg.request) {
                    this.onMessageFromFrontend(msg.workerRequestHash, msg.request)
                } else {
                    console.warn('Worker received message without request from frontend')
                }
            } catch (e) {
                console.error(e)
            }
        }
    }

    abstract onMessageFromFrontend(workerRequestHash: string, request: M): void

    sendResponse(workerRequestHash: string, response: R, transfer?: Transferable[]) {
        this.worker.sendResponse({workerRequestHash: workerRequestHash, response: response}, transfer)
    }
}
