import { WorkerResponse } from './WorkerResponse'
import { OffscreenWorkerMessage } from './OffscreenWorkerMessage'

export interface OffscreenWorker {
    sendMessage(message: OffscreenWorkerMessage, transfer?: (Transferable | OffscreenCanvas)[])
}

export class OffscreenWorkerFrontend implements OffscreenWorker {
    constructor(readonly worker: Worker, onResponseFromWorker: (response: WorkerResponse) => any) {
        worker.onmessage = (event) => {
            onResponseFromWorker(event?.data)
        }
    }

    sendMessage(message: OffscreenWorkerMessage, transfer?: (Transferable | OffscreenCanvas)[]) {
        this.worker.postMessage(message, transfer)
    }
}

export interface OffscreenBackend {
    onMessageFromLayer: (message: OffscreenWorkerMessage) => any

    sendResponse(response: WorkerResponse)
}

export class OffscreenWorkerBackend implements OffscreenBackend {
    onMessageFromLayer: (message: OffscreenWorkerMessage) => any

    constructor(readonly worker: Worker) {
        worker.addEventListener('message', (event) => this.onMessageFromLayer(event?.data))
    }

    sendResponse(response: WorkerResponse) {
        this.worker.postMessage(response)
    }
}

export class OffscreenFallbackWorker implements OffscreenWorker, OffscreenBackend {
    onMessageFromLayer: (message: OffscreenWorkerMessage) => any
    onResponseFromWorker: (response: WorkerResponse) => any

    sendMessage(message: OffscreenWorkerMessage, transfer?: (Transferable | OffscreenCanvas)[]) {
        this.onMessageFromLayer(message)
    }

    sendResponse(response: WorkerResponse) {
        this.onResponseFromWorker(response)
    }
}
