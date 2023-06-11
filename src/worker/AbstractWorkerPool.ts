import { TypedWorker, TypedWorkerFallback, TypedWorkerFrontend, WorkerRequestMessage, WorkerResponseMessage } from './TypedWorker'

export abstract class AbstractWorkerPool<M, R> {
    private readonly allWorkers: Set<TypedWorker<WorkerRequestMessage<M>, WorkerResponseMessage<R>>> = new Set()
    private readonly idleWorkers: TypedWorker<WorkerRequestMessage<M>, WorkerResponseMessage<R>>[] = []
    private readonly openRequests: Map<number, (response: R) => unknown> = new Map()
    private readonly messageBacklog: WorkerRequestMessage<M>[] = []
    private lastRequestId: number = 1

    protected abstract createWorker(): Worker

    protected abstract attachFallbackSystem(worker: TypedWorkerFallback<WorkerRequestMessage<M>, WorkerResponseMessage<R>>)

    startPool(poolSize: number, setupMessage: M): this {
        for (let c = 0; c < poolSize; c++) {
            setTimeout(() => {
                const worker = this.createTypedWorker()
                this.allWorkers.add(worker)
                if (setupMessage) {
                    this.lastRequestId++
                    const message = {workerRequestId: this.lastRequestId, request: setupMessage}
                    worker.sendMessage(message)
                    this.openRequests.set(message.workerRequestId, () => this.processNextMessage(worker))
                } else {
                    this.processNextMessage(worker)
                }
            })
        }
        return this
    }

    terminatePool() {
        this.allWorkers.forEach((w) => w.terminate())
    }

    private createTypedWorker(): TypedWorker<WorkerRequestMessage<M>, WorkerResponseMessage<R>> {
        try {
            const wadWorker = new TypedWorkerFrontend(this.createWorker(),
                (r: WorkerResponseMessage<R>) => this.onWorkerResponse(wadWorker, r))
            return wadWorker
        } catch (e) {
            console.warn('Could not setup threaded worker!\nUsing fallback to main thread, expect reduced performance.', e)
            const wadWorker = new TypedWorkerFallback<WorkerRequestMessage<M>, WorkerResponseMessage<R>>(
                (r: WorkerResponseMessage<R>) => this.onWorkerResponse(wadWorker, r))
            this.attachFallbackSystem(wadWorker)
            return wadWorker
        }
    }

    protected processMessage(request: M) {
        if (this.allWorkers.size < 1) console.warn(`Worker pool '${this.constructor.name}' received message, but has not worker threads`)
        this.lastRequestId++
        const message = {workerRequestId: this.lastRequestId, request: request}
        const idleWorker = this.idleWorkers.shift()
        if (idleWorker) {
            idleWorker.sendMessage(message)
        } else {
            this.messageBacklog.push(message) // TODO avoid duplicates here, especially when the thread pool is not yet started
        }
        return new Promise<R>((resolve) => this.openRequests.set(message.workerRequestId, resolve))
    }

    protected broadcast(broadcast: M) {
        if (this.allWorkers.size < 1) console.warn(`Worker pool '${this.constructor.name}' received broadcast, but has not worker threads`)
        this.allWorkers.forEach((worker) => {
            this.lastRequestId++
            const message = {workerRequestId: this.lastRequestId, request: broadcast}
            worker.sendMessage(message)
            this.openRequests.set(message.workerRequestId, () => {
            })
        })
    }

    private onWorkerResponse(worker, response: WorkerResponseMessage<R>) {
        if (response.workerRequestId) {
            const request = this.openRequests.get(response.workerRequestId)
            if (request) {
                this.openRequests.delete(response.workerRequestId)
                request(response.response)
            } else {
                console.warn(`Received response for unknown request ${response.workerRequestId}`)
            }
        } else {
            console.warn(`Received unexpected worker response`, response)
        }
        this.processNextMessage(worker)
    }

    private processNextMessage(worker: TypedWorker<WorkerRequestMessage<M>, WorkerResponseMessage<R>>) {
        const nextMessage = this.messageBacklog.shift()
        if (nextMessage) {
            worker.sendMessage(nextMessage)
        } else {
            this.idleWorkers.push(worker)
        }
    }
}
