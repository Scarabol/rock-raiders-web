import { AbstractWorkerPool } from './AbstractWorkerPool'
import { TypedWorkerFallback, WorkerRequestMessage, WorkerResponseMessage } from './TypedWorker'
import { DependencySpriteSystem, DependencySpriteWorkerRequest, DependencySpriteWorkerRequestType, DependencySpriteWorkerResponse } from './DependencySpriteWorker'
import { EntityDependencyChecked, GameConfig } from '../cfg/GameConfig'
import { SpriteImage } from '../core/Sprite'
import { BitmapFontData } from '../core/BitmapFont'
import { imgDataToCanvas } from '../core/ImageHelper'

export class DependencySpriteWorkerPool extends AbstractWorkerPool<DependencySpriteWorkerRequest, DependencySpriteWorkerResponse> {
    static readonly instance = new DependencySpriteWorkerPool()
    static readonly dependencySpriteCache: Map<string, SpriteImage> = new Map()

    setupPool(args: {
        teleportManNormal: ImageData,
        teleportManDisabled: ImageData,
        tooltipFontData: BitmapFontData,
        plusSign: ImageData,
        equalSign: ImageData,
        depInterfaceBuildImageData: Map<string, ImageData[]>,
    }) {
        const depInterfaceImageData: Map<string, ImageData[]> = new Map()
        depInterfaceImageData.set('Interface_MenuItem_TeleportMan'.toLowerCase(), [args.teleportManNormal, args.teleportManDisabled])
        return this.startPool(4, {
            type: DependencySpriteWorkerRequestType.SETUP,
            upgradeNames: GameConfig.instance.upgradeNames,
            tooltipFontData: args.tooltipFontData,
            plusSignImgData: args.plusSign,
            equalSignImgData: args.equalSign,
            interfaceImageData: depInterfaceImageData,
            interfaceBuildImageData: args.depInterfaceBuildImageData,
        })
    }

    async createDependenciesSprite(dependencies: EntityDependencyChecked[]): Promise<SpriteImage> {
        const depHash = dependencies.map((d) => `${d.itemKey}:${d.minLevel}=${d.isOk}`).join(';')
        const fromCache = DependencySpriteWorkerPool.dependencySpriteCache.get(depHash)
        if (fromCache) return fromCache
        const message = {type: DependencySpriteWorkerRequestType.CREATE_SPRITE, dependencies: dependencies, hash: depHash}
        const response = await this.processMessage(message)
        const imgData = response.dependencyImage
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
