import { WorkerResponse } from './WorkerResponse'

export interface TypedWorker<M> {
    sendMessage(message: M, transfer?: (Transferable | OffscreenCanvas)[])
}

export class TypedWorkerFrontend<M> implements TypedWorker<M> {
    constructor(readonly worker: Worker, onResponseFromWorker: (response: WorkerResponse) => any) {
        worker.onmessage = (event) => {
            onResponseFromWorker(event?.data)
        }
    }

    sendMessage(message: M, transfer?: (Transferable | OffscreenCanvas)[]) {
        this.worker.postMessage(message, transfer)
    }
}

export interface TypedWorkerBackend<M> {
    onMessageFromFrontend: (message: M) => any

    sendResponse(response: WorkerResponse)
}

export class TypedWorkerThreaded<M> implements TypedWorkerBackend<M> {
    onMessageFromFrontend: (message: M) => any

    constructor(readonly worker: Worker) {
        worker.addEventListener('message', (event) => this.onMessageFromFrontend(event?.data))
    }

    sendResponse(response: WorkerResponse) {
        this.worker.postMessage(response)
    }
}

export class TypedWorkerFallback<M> implements TypedWorker<M>, TypedWorkerBackend<M> {
    onMessageFromFrontend: (message: M) => any

    constructor(readonly onResponseFromWorker: (response: WorkerResponse) => any) {
    }

    sendMessage(message: M, transfer?: (Transferable | OffscreenCanvas)[]) {
        this.onMessageFromFrontend(message)
    }

    sendResponse(response: WorkerResponse) {
        this.onResponseFromWorker(response)
    }
}
