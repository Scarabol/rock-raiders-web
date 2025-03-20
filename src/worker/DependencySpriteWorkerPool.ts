import { AbstractWorkerPool } from './AbstractWorkerPool'
import { TypedWorkerFallback, WorkerRequestMessage, WorkerResponseMessage } from './TypedWorker'
import { DependencySpriteSystem, DependencySpriteWorkerCreateSpriteRequest, DependencySpriteWorkerRequest, DependencySpriteWorkerRequestType, DependencySpriteWorkerResponse } from './DependencySpriteWorker'
import { EntityDependencyChecked, GameConfig } from '../cfg/GameConfig'
import { SpriteImage } from '../core/Sprite'
import { BitmapFontData } from '../core/BitmapFont'
import { imgDataToCanvas } from '../core/ImageHelper'

export class DependencySpriteWorkerPool extends AbstractWorkerPool<DependencySpriteWorkerRequest, DependencySpriteWorkerResponse> {
    static readonly instance = new DependencySpriteWorkerPool()
    static readonly dependencySpriteCache: Map<string, SpriteImage> = new Map()

    setupPool(args: {
        teleportManImageData: Map<string, [ImageData, ImageData]>,
        tooltipFontData: BitmapFontData,
        plusSign: ImageData,
        equalSign: ImageData,
        depInterfaceBuildImageData: Map<string, [ImageData, ImageData]>,
    }) {
        return this.startPool(4, {
            type: DependencySpriteWorkerRequestType.SETUP,
            upgradeNames: GameConfig.instance.upgradeNames,
            tooltipFontData: args.tooltipFontData,
            plusSignImgData: args.plusSign,
            equalSignImgData: args.equalSign,
            interfaceImageData: args.teleportManImageData,
            interfaceBuildImageData: args.depInterfaceBuildImageData,
        })
    }

    async createDependenciesSprite(dependencies: EntityDependencyChecked[]): Promise<SpriteImage | undefined> {
        const depHash = dependencies.map((d) => `${d.itemKey}:${d.minLevel}=${d.isOk}`).join(';')
        const fromCache = DependencySpriteWorkerPool.dependencySpriteCache.get(depHash)
        if (fromCache) return fromCache
        const message: DependencySpriteWorkerCreateSpriteRequest & { hash: string } = {type: DependencySpriteWorkerRequestType.CREATE_SPRITE, dependencies: dependencies, hash: depHash}
        const response = await this.processMessage(message)
        const imgData = response.dependencyImage
        if (!imgData) return undefined
        const dependencyImage = imgDataToCanvas(imgData)
        DependencySpriteWorkerPool.dependencySpriteCache.set(depHash, dependencyImage)
        return dependencyImage
    }

    protected createWorker() {
        return new Worker(new URL('./DependencySpriteWorker', import.meta.url), {type: 'module'}) // do not change this line otherwise no worker.js is exported for production
    }

    protected attachFallbackSystem(worker: TypedWorkerFallback<WorkerRequestMessage<DependencySpriteWorkerRequest>, WorkerResponseMessage<DependencySpriteWorkerResponse>>) {
        new DependencySpriteSystem(worker)
    }
}
