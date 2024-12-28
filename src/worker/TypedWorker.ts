export interface WorkerRequestMessage<T> {
    workerRequestHash: string
    request: T
}

export interface WorkerResponseMessage<T> {
    workerRequestHash: string
    response: T
}

export interface TypedWorker<M> {
    sendMessage(message: M, transfer?: (Transferable | OffscreenCanvas)[]): void

    terminate(): void
}

export class TypedWorkerFrontend<M, R> implements TypedWorker<M> {
    constructor(readonly worker: Worker, onResponseFromWorker: (response: R) => void) {
        worker.onmessage = (event) => {
            onResponseFromWorker(event?.data)
        }
        worker.onerror = (event) => {
            console.error(`Unexpected error event in worker`, event)
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
    onMessageFromFrontend: (message: M) => void

    sendResponse(response: R, transfer?: Transferable[]): void
}

export class TypedWorkerThreaded<M, R> implements TypedWorkerBackend<M, R> {
    onMessageFromFrontend: (message: M) => void = () => {
        throw new Error('Not implemented')
    }

    constructor(readonly worker: Worker) {
        worker.addEventListener('message', (event) => this.onMessageFromFrontend(event?.data))
    }

    sendResponse(response: R, transfer?: Transferable[]) {
        this.worker.postMessage(response, transfer)
    }
}

export class TypedWorkerFallback<M, R> implements TypedWorker<M>, TypedWorkerBackend<M, R> {
    onMessageFromFrontend: (message: M) => void = () => {
        throw new Error('Not implemented')
    }

    constructor(readonly onResponseFromWorker: (response: R) => void) {
    }

    sendMessage(message: M, _transfer?: (Transferable | OffscreenCanvas)[]) {
        this.onMessageFromFrontend(message)
    }

    sendResponse(response: R) {
        this.onResponseFromWorker(response)
    }

    terminate() {
    }
}
