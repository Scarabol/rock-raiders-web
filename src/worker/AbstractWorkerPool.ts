import { TypedWorker, TypedWorkerFallback, TypedWorkerFrontend, WorkerRequestMessage, WorkerResponseMessage } from './TypedWorker'

export abstract class AbstractWorkerPool<M, R> {
    private readonly allWorkers: Set<TypedWorker<WorkerRequestMessage<M>, WorkerResponseMessage<R>>> = new Set()
    private readonly idleWorkers: TypedWorker<WorkerRequestMessage<M>, WorkerResponseMessage<R>>[] = []
    private readonly openRequests: Map<number, (response: R) => unknown> = new Map()
    private readonly messageBacklog: WorkerRequestMessage<M>[] = []
    private lastRequestId: number = 1

    protected abstract createWorker(): Worker

    protected abstract attachFallbackSystem(worker: TypedWorkerFallback<WorkerRequestMessage<M>, WorkerResponseMessage<R>>)

    createPool(poolSize: number, setupMessage: WorkerRequestMessage<M>): this {
        for (let c = 0; c < poolSize; c++) {
            setTimeout(() => {
                const worker = this.createTypedWorker()
                this.allWorkers.add(worker)
                if (setupMessage) worker.sendMessage(setupMessage)
                const nextMessage = this.messageBacklog.shift()
                if (nextMessage) {
                    worker.sendMessage(nextMessage)
                } else {
                    this.idleWorkers.push(worker)
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
        this.lastRequestId++
        const message = {workerRequestId: this.lastRequestId, request: request}
        const idleWorker = this.idleWorkers.shift()
        if (idleWorker) {
            idleWorker.sendMessage(message)
        } else {
            this.messageBacklog.push(message)
        }
        return new Promise<R>((resolve) => this.openRequests.set(message.workerRequestId, resolve))
    }

    protected broadcast(broadcast: M) {
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
        const nextMessage = this.messageBacklog.shift()
        if (nextMessage) {
            worker.sendMessage(nextMessage)
        } else {
            this.idleWorkers.add(worker)
        }
    }
}
