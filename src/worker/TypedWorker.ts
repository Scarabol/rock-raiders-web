export interface TypedWorker<M, R> {
    sendMessage(message: M, transfer?: (Transferable | OffscreenCanvas)[])

    terminate(): void
}

export class TypedWorkerFrontend<M, R> implements TypedWorker<M, R> {
    constructor(readonly worker: Worker, onResponseFromWorker: (response: R) => any) {
        worker.onmessage = (event) => {
            onResponseFromWorker(event?.data)
        }
    }

    sendMessage(message: M, transfer?: (Transferable | OffscreenCanvas)[]) {
        this.worker.postMessage(message, transfer)
    }

    terminate() {
        this.worker.terminate()
    }
}

export interface TypedWorkerBackend<M, R> {
    onMessageFromFrontend: (message: M) => any

    sendResponse(response: R)
}

export class TypedWorkerThreaded<M, R> implements TypedWorkerBackend<M, R> {
    onMessageFromFrontend: (message: M) => any

    constructor(readonly worker: Worker) {
        worker.addEventListener('message', (event) => this.onMessageFromFrontend(event?.data))
    }

    sendResponse(response: R) {
        this.worker.postMessage(response)
    }
}

export class TypedWorkerFallback<M, R> implements TypedWorker<M, R>, TypedWorkerBackend<M, R> {
    onMessageFromFrontend: (message: M) => any

    constructor(readonly onResponseFromWorker: (response: R) => any) {
    }

    sendMessage(message: M, transfer?: (Transferable | OffscreenCanvas)[]) {
        this.onMessageFromFrontend(message)
    }

    sendResponse(response: R) {
        this.onResponseFromWorker(response)
    }

    terminate() {
    }
}
