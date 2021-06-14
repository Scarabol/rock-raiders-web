import { AudioListener, RepeatWrapping, Texture } from 'three'
import { createDummyImgData } from '../core/ImageHelper'
import { getFilename, getPath } from '../core/Util'
import { AnimationEntityType } from '../game/model/anim/AnimationEntityType'
import { SceneMesh } from '../scene/SceneMesh'
import { AnimEntityLoader } from './AnimEntityLoader'
import { LWOLoader } from './LWOLoader'
import { ResourceCache } from './ResourceCache'
import { InitLoadingMessage } from './wadworker/InitLoadingMessage'
import { WadWorkerMessage } from './wadworker/WadWorkerMessage'
import { WorkerMessageType } from './wadworker/WorkerMessageType'

export class ResourceManager extends ResourceCache {

    static worker: Worker = new Worker(new URL('./wadworker/WadWorker', import.meta.url))

    static lwoCache: Map<string, SceneMesh> = new Map()

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
                msg.assetNames.forEach((assetName) => this.resourceByName.set(assetName.toLowerCase(), msg.assetObj))
                msg.sfxKeys?.forEach((sfxKey) => this.sfxByKey.set(sfxKey, msg.assetObj))
                this.onAssetLoaded()
            } else if (msg.type === WorkerMessageType.MSG) {
                this.onMessage(msg.text)
            } else if (msg.type === WorkerMessageType.CFG) {
                this.configuration = msg.cfg
                this.stats = msg.stats
                this.loadDefaultCursor()
                this.onInitialLoad(msg.totalResources)
            } else if (msg.type === WorkerMessageType.CACHE_MISS) {
                this.onCacheMissed()
            } else if (msg.type === WorkerMessageType.DONE) {
                this.loadAllCursor()
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

    static getTexturesBySequenceName(basename: string): Texture[] {
        const lBasename = basename?.toLowerCase()
        const result = []
        this.resourceByName.forEach((res, name) => {
            if (name.startsWith(lBasename)) result.push(name)
        })
        if (result.length > 0) {
            return result.map((textureFilepath) => this.getTexture(textureFilepath))
        } else if (!lBasename.startsWith('world/shared/')) {
            return this.getTexturesBySequenceName('world/shared/' + getFilename(lBasename))
        } else {
            console.warn('Texture sequence not found: ' + lBasename)
            return []
        }
    }

    static getMeshTexture(textureFilename: string, meshPath: string, entityPath: string): Texture {
        const lTextureFilename = textureFilename?.toLowerCase()
        const lMeshFilepath = meshPath?.toLowerCase() + lTextureFilename
        const imgData = this.resourceByName.getOrUpdate(lMeshFilepath, () => {
            const lEntityFilepath = entityPath ? entityPath.toLowerCase() + lTextureFilename : null
            if (entityPath) {
                return this.resourceByName.getOrUpdate(lEntityFilepath, () => {
                    return this.getImgDataFromSharedPaths(lTextureFilename, textureFilename, lMeshFilepath, lEntityFilepath)
                })
            } else {
                return this.getImgDataFromSharedPaths(lTextureFilename, textureFilename, lMeshFilepath, lEntityFilepath)
            }
        })
        if (!imgData) return null
        // without repeat wrapping some entities are not fully textured
        const texture = new Texture(imgData, Texture.DEFAULT_MAPPING, RepeatWrapping, RepeatWrapping)
        texture.needsUpdate = true // without everything is just dark
        return texture
    }

    private static getImgDataFromSharedPaths(lTextureFilename: string, textureFilename: string, lMeshFilepath: string, lEntityFilepath: string): ImageData {
        const ugSharedFilename = 'vehicles/sharedug/' + lTextureFilename
        return this.resourceByName.getOrUpdate(ugSharedFilename, () => {
            const worldSharedFilename = 'world/shared/' + lTextureFilename
            return this.resourceByName.getOrUpdate(worldSharedFilename, () => {
                if (lTextureFilename !== 'teofoilreflections.jpg' && lTextureFilename !== 'wingbase3.bmp' &&
                    lTextureFilename !== 'a_side.bmp' && lTextureFilename !== 'a_top.bmp') {
                    console.warn('Texture \'' + textureFilename + '\' (' + lMeshFilepath + ', ' + lEntityFilepath + ', ' + worldSharedFilename + ') unknown! Using placeholder texture instead')
                    return createDummyImgData(64, 64)
                }
                return null
            })
        })
    }

    static getTexture(textureFilepath): Texture | null {
        if (!textureFilepath) {
            throw new Error('textureFilepath must not be undefined, null or empty - was ' + textureFilepath)
        }
        const imgData = this.resourceByName.get(textureFilepath.toLowerCase())
        if (!imgData) return null
        // without repeat wrapping some entities are not fully textured
        const texture = new Texture(imgData, Texture.DEFAULT_MAPPING, RepeatWrapping, RepeatWrapping)
        texture.needsUpdate = true // without everything is just dark
        return texture
    }

    static getAnimationEntityType(aeFilename: string, audioListener: AudioListener): AnimationEntityType {
        let cfgRoot = this.getResource(aeFilename)
        if (!cfgRoot) throw new Error('Could not get animation entity type for: ' + aeFilename)
        return new AnimEntityLoader(aeFilename, cfgRoot, audioListener).loadModels()
    }

    static getLwoModel(lwoFilepath: string, entityPath: string = null): SceneMesh {
        return this.lwoCache.getOrUpdate(lwoFilepath.toLowerCase(), () => {
            const lwoBuffer = ResourceManager.getResource(lwoFilepath)
            if (!lwoBuffer) return null
            return new LWOLoader(getPath(lwoFilepath), entityPath).parse(lwoBuffer)
        })?.clone()
    }

}
