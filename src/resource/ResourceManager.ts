import { AudioListener, RepeatWrapping, Texture } from 'three'
import { SoundManager } from '../audio/SoundManager'
import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { createContext } from '../core/ImageHelper'
import { getFilename, getPath } from '../core/Util'
import { AnimationEntityType } from '../game/model/anim/AnimationEntityType'
import { DEV_MODE } from '../params'
import { SceneMesh } from '../scene/SceneMesh'
import { TypedWorker, TypedWorkerFallback, TypedWorkerFrontend } from '../worker/TypedWorker'
import { AnimEntityLoader } from './AnimEntityLoader'
import { LWOLoader } from './LWOLoader'
import { ResourceCache } from './ResourceCache'
import { InitLoadingMessage } from './wadworker/InitLoadingMessage'
import { WadSystem } from './wadworker/WadSystem'
import { WadWorkerMessage } from './wadworker/WadWorkerMessage'
import { WorkerMessageType } from './wadworker/WorkerMessageType'

export class ResourceManager extends ResourceCache {
    static worker: TypedWorker<InitLoadingMessage>
    static lwoCache: Map<string, SceneMesh> = new Map()
    static tooltipSpriteCache: Map<string, SpriteImage> = new Map()

    static initWorker() {
        try {
            this.worker = new TypedWorkerFrontend(new Worker(new URL('./wadworker/WadWorker', import.meta.url), {type: 'module'}), (msg) => this.onWadLoaderMessage(msg))
        } catch (e) {
            console.warn('Could not setup threaded worker!\nUsing fallback to main thread, which might has bad performance.', e)
            this.worker = new TypedWorkerFallback<InitLoadingMessage>((r) => this.onWadLoaderMessage(r))
            new WadSystem(this.worker as TypedWorkerFallback<InitLoadingMessage>)
        }
    }

    static startLoadingFromCache() {
        return this.worker.sendMessage(null)
    }

    static startLoadingFromUrl(wad0Url: string, wad1Url: string) {
        return this.worker.sendMessage(new InitLoadingMessage(wad0Url, wad1Url))
    }

    private static onWadLoaderMessage(msg: WadWorkerMessage) {
        if (msg.type === WorkerMessageType.ASSET) {
            msg.assetNames.forEach((assetName) => this.resourceByName.set(assetName.toLowerCase(), msg.assetObj))
            msg.sfxKeys?.forEach((sfxKey) => SoundManager.sfxByKey.set(sfxKey, msg.assetObj))
            this.onAssetLoaded()
        } else if (msg.type === WorkerMessageType.MSG) {
            this.onLoadingMessage(msg.text)
        } else if (msg.type === WorkerMessageType.CFG) {
            this.configuration = msg.cfg
            this.loadDefaultCursor().then(() => this.onInitialLoad(msg.totalResources))
        } else if (msg.type === WorkerMessageType.CACHE_MISS) {
            this.onCacheMissed()
        } else if (msg.type === WorkerMessageType.DONE) {
            this.loadAllCursor().then(() => {
                console.log(`Loading of about ${msg.totalResources} assets complete!`)
                this.onLoadDone()
            })
        }
    }

    static onLoadingMessage: (msg: string) => any = (msg: string) => {
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

    static getLevelEntryCfg(levelName: string): LevelEntryCfg {
        const levelConf = this.configuration.levels.levelCfgByName.get(levelName)
        if (!levelConf) throw new Error(`Could not find level configuration for "${levelName}"`)
        return levelConf
    }

    static getTexturesBySequenceName(basename: string): Texture[] {
        const lBasename = basename?.toLowerCase()
        const result: string[] = []
        this.resourceByName.forEach((res, name) => {
            if (name.startsWith(lBasename + '0')) result.push(name)
        })
        if (result.length > 0) {
            return result.map((textureFilepath) => this.getTexture(textureFilepath))
        } else if (!lBasename.startsWith('world/shared/')) {
            return this.getTexturesBySequenceName(`world/shared/${getFilename(lBasename)}`)
        } else {
            console.warn(`Texture sequence not found: ${lBasename}`)
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
        const ugSharedFilename = `vehicles/sharedug/${lTextureFilename}`
        return this.resourceByName.getOrUpdate(ugSharedFilename, () => {
            const worldSharedFilename = `world/shared/${lTextureFilename}`
            return this.resourceByName.getOrUpdate(worldSharedFilename, () => {
                if (!DEV_MODE) console.warn(`Texture '${textureFilename}' (${lMeshFilepath}, ${lEntityFilepath}, ${worldSharedFilename}) unknown!`)
                return null
            })
        })
    }

    static getTexture(textureFilepath: string): Texture | null {
        if (!textureFilepath) {
            throw new Error(`textureFilepath must not be undefined, null or empty - was ${textureFilepath}`)
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
        if (!cfgRoot) throw new Error(`Could not get animation entity type for: ${aeFilename}`)
        return new AnimEntityLoader(aeFilename, cfgRoot, audioListener).loadModels()
    }

    static getLwoModel(lwoFilepath: string, entityPath: string = null): SceneMesh {
        return this.lwoCache.getOrUpdate(lwoFilepath.toLowerCase(), () => {
            const lwoBuffer = ResourceManager.getResource(lwoFilepath)
            if (!lwoBuffer) return null
            const result = new LWOLoader(getPath(lwoFilepath), entityPath).parse(lwoBuffer)
            result.name = lwoFilepath
            return result
        })?.clone()
    }

    static getTooltip(tooltipKey: string): SpriteImage {
        return this.tooltipSpriteCache.getOrUpdate(tooltipKey, () => {
            const tooltipText = this.configuration.tooltips.get(tooltipKey)
            if (!tooltipText) return null
            const tooltipTextImage = this.getTooltipFont().createTextImage(tooltipText)
            const margin = 2
            const padding = 2
            const context = createContext(tooltipTextImage.width + 2 * margin + 2 * padding, tooltipTextImage.height + 2 * margin + 2 * padding)
            context.fillStyle = '#001600'
            context.fillRect(0, 0, context.canvas.width, context.canvas.height)
            context.fillStyle = '#006400' // TODO read ToolTipRGB from config
            context.fillRect(0, 0, tooltipTextImage.width + margin + 2 * padding, tooltipTextImage.height + margin + 2 * padding)
            context.fillStyle = '#003200'
            context.fillRect(margin, margin, tooltipTextImage.width + 2 * padding, tooltipTextImage.height + 2 * padding)
            context.drawImage(tooltipTextImage, margin + padding, margin + padding)
            return context.canvas
        })
    }
}
