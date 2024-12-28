import { TypedWorker, TypedWorkerFallback, TypedWorkerFrontend, WorkerRequestMessage, WorkerResponseMessage } from './TypedWorker'

export abstract class AbstractWorkerPool<M, R> {
    private readonly allWorkers: Set<TypedWorker<WorkerRequestMessage<M>>> = new Set()
    private readonly idleWorkers: TypedWorker<WorkerRequestMessage<M>>[] = []
    private readonly openRequests: Map<string, ((response: R) => unknown)[]> = new Map()
    private readonly messageBacklog: WorkerRequestMessage<M>[] = []
    private readonly broadcastHistory: Set<M> = new Set()
    private lastRequestId: number = 1

    protected abstract createWorker(): Worker

    protected abstract attachFallbackSystem(worker: TypedWorkerFallback<WorkerRequestMessage<M>, WorkerResponseMessage<R>>): void

    startPool(poolSize: number, setupMessage: M | undefined): this {
        if (this.allWorkers.size > 0) {
            console.warn('Pool already has been started')
            return this
        }
        for (let c = 0; c < poolSize; c++) {
            const worker = this.createTypedWorker()
            this.allWorkers.add(worker)
            if (setupMessage) {
                this.lastRequestId++
                const message: WorkerRequestMessage<M> = {workerRequestHash: `message-${this.lastRequestId}`, request: setupMessage}
                worker.sendMessage(message)
                this.openRequests.getOrUpdate(message.workerRequestHash, () => []).push(() => this.sendBroadcasts(worker))
            } else {
                this.sendBroadcasts(worker)
            }
        }
        return this
    }

    private sendBroadcasts(worker: TypedWorker<WorkerRequestMessage<M>>) {
        if (this.allWorkers.size < 1) throw new Error('No workers, has pool been started?')
        this.broadcastHistory.forEach((broadcast) => {
            this.lastRequestId++
            const message: WorkerRequestMessage<M> = {workerRequestHash: `message-${this.lastRequestId}`, request: broadcast}
            worker.sendMessage(message)
        })
        this.processNextMessage(worker)
    }

    terminatePool() {
        this.allWorkers.forEach((w) => w.terminate())
    }

    private createTypedWorker(): TypedWorker<WorkerRequestMessage<M>> {
        try {
            const workerFrontend: TypedWorkerFrontend<WorkerRequestMessage<M>, WorkerResponseMessage<R>> = new TypedWorkerFrontend(this.createWorker(),
                (r: WorkerResponseMessage<R>) => this.onWorkerResponse(workerFrontend, r))
            return workerFrontend
        } catch (e) {
            console.warn('Could not setup threaded worker!\nUsing fallback to main thread, expect reduced performance.', e)
            const wadWorker: TypedWorkerFallback<WorkerRequestMessage<M>, WorkerResponseMessage<R>> = new TypedWorkerFallback(
                (r: WorkerResponseMessage<R>) => this.onWorkerResponse(wadWorker, r))
            this.attachFallbackSystem(wadWorker)
            return wadWorker
        }
    }

    protected processMessage(request: M & { hash?: string }): Promise<R> {
        if (this.allWorkers.size < 1) throw new Error('No workers, has pool been started?')
        let workerRequestHash = request.hash
        if (!workerRequestHash) {
            this.lastRequestId++
            workerRequestHash = `message-${this.lastRequestId}`
        }
        const message = {workerRequestHash: workerRequestHash, request: request}
        const idleWorker = this.idleWorkers.shift()
        if (idleWorker) {
            idleWorker.sendMessage(message)
        } else {
            const duplicates = this.openRequests.getOrUpdate(message.workerRequestHash, () => [])
            if (duplicates.length < 1) this.messageBacklog.push(message)
        }
        return new Promise<R>((resolve) => this.openRequests.getOrUpdate(message.workerRequestHash, () => []).push(resolve))
    }

    protected broadcast(broadcast: M): Promise<R>[] {
        if (this.allWorkers.size < 1) throw new Error('No workers, has pool been started?')
        this.broadcastHistory.add(broadcast)
        const result: Promise<R>[] = []
        this.allWorkers.forEach((worker) => {
            this.lastRequestId++
            const message = {workerRequestHash: `message-${this.lastRequestId}`, request: broadcast}
            worker.sendMessage(message)
            result.push(new Promise<R>((resolve) => this.openRequests.getOrUpdate(message.workerRequestHash, () => []).push(resolve)))
        })
        return result
    }

    private onWorkerResponse(worker: TypedWorker<WorkerRequestMessage<M>>, response: WorkerResponseMessage<R>) {
        if (response.workerRequestHash) {
            const requests = this.openRequests.get(response.workerRequestHash)
            if (requests) {
                requests.forEach((r) => r(response.response))
                this.openRequests.set(response.workerRequestHash, [])
            } else {
                console.warn(`Received response for unknown request ${response.workerRequestHash}`)
            }
        } else {
            console.warn(`Received unexpected worker response`, response)
        }
        this.processNextMessage(worker)
    }

    private processNextMessage(worker: TypedWorker<WorkerRequestMessage<M>>) {
        const nextMessage = this.messageBacklog.shift()
        if (nextMessage) {
            worker.sendMessage(nextMessage)
        } else {
            this.idleWorkers.push(worker)
        }
    }
}
