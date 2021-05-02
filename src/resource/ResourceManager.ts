import { RepeatWrapping, Texture } from 'three'
import { createDummyImgData } from '../core/ImageHelper'
import { getFilename } from '../core/Util'
import { AnimationEntityType } from '../game/model/anim/AnimationEntityType'
import { AnimEntityLoader } from './AnimEntityLoader'
import { ResourceCache } from './ResourceCache'
import { InitLoadingMessage } from './wadworker/InitLoadingMessage'
import { WadWorkerMessage } from './wadworker/WadWorkerMessage'
import { WorkerMessageType } from './wadworker/WorkerMessageType'

export class ResourceManager extends ResourceCache {

    static worker: Worker = new Worker(new URL('./wadworker/WadWorker', import.meta.url))

    static startLoadingFromCache() {
        return this.startLoading(null)
    }

    static startLoadingFromUrl(wad0Url: string, wad1Url: string) {
        return this.startLoading(new InitLoadingMessage(wad0Url, wad1Url))
    }

    private static startLoading(msg: InitLoadingMessage) {
        this.worker.onmessage = (event) => {
            const msg: WadWorkerMessage = event.data
            if (msg.type === WorkerMessageType.ASSET) {
                this.resourceByName.set(msg.assetName.toLowerCase(), msg.assetObj)
                const alphaIndexMatch = msg.assetName.toLowerCase().match(/(.*a)\d\d\d(_.+)/)
                if (alphaIndexMatch) this.resourceByName.set(alphaIndexMatch[1] + alphaIndexMatch[2], msg.assetObj)
                this.onAssetLoaded()
            } else if (msg.type === WorkerMessageType.MSG) {
                this.onMessage(msg.text)
            } else if (msg.type === WorkerMessageType.CFG) {
                this.configuration = msg.cfg
                this.stats = msg.stats
                this.onInitialLoad(msg.totalResources)
            } else if (msg.type === WorkerMessageType.CACHE_MISS) {
                this.onCacheMissed()
            } else if (msg.type === WorkerMessageType.DONE) {
                console.log('Loading of about ' + msg.totalResources + ' assets complete! Total load time: ' + msg.loadingTimeSeconds + ' seconds.')
                this.onLoadDone()
            }
        }
        this.worker.postMessage(msg)
    }

    static onMessage: (msg: string) => any = (msg: string) => {
        console.log(msg)
    }

    static onCacheMissed: () => any = () => {
        console.log('Worker missed cache')
    }

    static onInitialLoad: (totalResources: number) => any = () => {
        console.log('Initial loading done.')
    }

    static onAssetLoaded: () => any = () => {
    }

    static onLoadDone: () => any = () => {
    }

    static filterTextureSequenceNames(basename: string): string[] {
        const lBasename = basename.toLowerCase()
        const result = []
        this.resourceByName.forEach((res, name) => {
            if (name.startsWith(lBasename)) result.push(name)
        })
        if (result.length > 0) {
            return result
        } else if (!lBasename.startsWith('world/shared/')) {
            return this.filterTextureSequenceNames('world/shared/' + getFilename(basename))
        } else {
            console.warn('Texture sequence not found: ' + basename)
            return null
        }
    }

    static getTexture(textureName): Texture {
        if (!textureName || textureName.length === 0) {
            throw 'textureName must not be undefined, null or empty - was ' + textureName
        }
        const lTextureName = textureName.toLowerCase()
        const imgData = this.resourceByName.getOrUpdate(lTextureName, () => {
            const lSharedTextureName = 'world/shared/' + getFilename(lTextureName)
            return this.resourceByName.getOrUpdate(lSharedTextureName, () => {
                console.warn('Texture \'' + textureName + '\' (' + lTextureName + ', ' + lSharedTextureName + ') unknown! Using placeholder texture instead')
                return createDummyImgData(64, 64)
            })
        })
        const texture = new Texture(imgData, Texture.DEFAULT_MAPPING, RepeatWrapping, RepeatWrapping)
        texture.needsUpdate = true
        return texture
    }

    static getAnimationEntityType(aeFilename: string): AnimationEntityType {
        let cfgRoot = this.getResource(aeFilename)
        if (!cfgRoot) throw 'Could not get animation entity type for: ' + aeFilename
        return AnimEntityLoader.loadModels(aeFilename, cfgRoot)
    }

}
