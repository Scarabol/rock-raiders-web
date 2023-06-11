import { AbstractWorkerPool } from './AbstractWorkerPool'
import { TypedWorkerFallback, WorkerRequestMessage, WorkerResponseMessage } from './TypedWorker'
import { DependencySpriteSystem, DependencySpriteWorkerRequest, DependencySpriteWorkerRequestType, DependencySpriteWorkerResponse } from './DependencySpriteWorker'
import { EntityDependencyChecked } from '../cfg/GameConfig'

export class DependencySpriteWorkerPool extends AbstractWorkerPool<DependencySpriteWorkerRequest, DependencySpriteWorkerResponse> {
    protected createWorker() {
        return new Worker(new URL('./DependencySpriteWorker', import.meta.url), {type: 'module'}) // do not change this line otherwise no worker.js is exported for production
    }

    protected attachFallbackSystem(worker: TypedWorkerFallback<WorkerRequestMessage<DependencySpriteWorkerRequest>, WorkerResponseMessage<DependencySpriteWorkerResponse>>) {
        new DependencySpriteSystem(worker)
    }

    async createDependenciesSprite(dependencies: EntityDependencyChecked[]): Promise<ImageData> {
        const message = {type: DependencySpriteWorkerRequestType.CREATE_SPRITE, dependencies: dependencies}
        const response = await this.processMessage(message)
        return response.dependencyImage
    }
}
