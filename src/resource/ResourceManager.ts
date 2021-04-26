import { RepeatWrapping, Texture } from 'three'
import { GameStatsCfg } from '../cfg/GameStatsCfg'
import { BitmapFont } from '../core/BitmapFont'
import { createContext, createDummyImgData } from '../core/ImageHelper'
import { getFilename } from '../core/Util'
import { AnimationEntityType } from '../game/model/anim/AnimationEntityType'
import { AnimEntityLoader } from './AnimEntityLoader'
import { InitLoadingMessage } from './wadworker/InitLoadingMessage'
import { iGet } from './wadworker/WadUtil'
import { WadWorkerMessage } from './wadworker/WadWorkerMessage'
import { WorkerMessageType } from './wadworker/WorkerMessageType'

export class ResourceManager {

    static worker: Worker = new Worker(new URL('./wadworker/WadWorker', import.meta.url))
    static configuration: any = {}
    static resourceByName: {} = {}
    static fontCache = {}
    static stats: GameStatsCfg

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
                this.resourceByName[msg.assetName.toLowerCase()] = msg.assetObj
                this.onAssetLoaded()
            } else if (msg.type === WorkerMessageType.MSG) {
                this.onMessage(msg.text)
            } else if (msg.type === WorkerMessageType.CFG) {
                this.configuration = msg.cfg
                this.stats = new GameStatsCfg(this.cfg('Stats'))
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

    static cfg(...keys: string[]): any {
        return iGet(ResourceManager.configuration, ...keys)
    }

    static filterTextureSequenceNames(basename: string): string[] {
        const lBasename = basename.toLowerCase()
        const result = Object.keys(this.resourceByName).filter((name) => name.startsWith(lBasename))
        if (result.length > 0) {
            return result
        } else if (!lBasename.startsWith('world/shared/')) {
            return ResourceManager.filterTextureSequenceNames('world/shared/' + getFilename(basename))
        } else {
            console.warn('Texture sequence not found: ' + basename)
            return null
        }
    }

    static getResource(resourceName: string): any {
        const lName = resourceName ? resourceName.toString().toLowerCase() : null
        if (lName && this.resourceByName.hasOwnProperty(lName)) {
            return this.resourceByName[lName]
        }
        return null
    }

    static getImageData(imageName): ImageData {
        if (!imageName || imageName.length === 0) {
            throw 'imageName must not be undefined, null or empty - was ' + imageName
        }
        const lImageName = imageName.toLowerCase()
        let imgData = this.getResource(lImageName)
        if (!imgData) {
            console.error('Image \'' + imageName + '\' unknown! Using placeholder image instead')
            ResourceManager.resourceByName[lImageName] = createDummyImgData(64, 64)
        }
        return ResourceManager.resourceByName[lImageName]
    }

    static getImage(imageName: string): HTMLCanvasElement {
        const imgData = this.getImageData(imageName)
        const context: CanvasRenderingContext2D = createContext(imgData.width, imgData.height)
        context.putImageData(imgData, 0, 0)
        return context.canvas
    }

    static getImageOrNull(imageName: string): HTMLCanvasElement | null {
        if (!imageName) return null
        return this.getImage(imageName)
    }

    static getTexture(textureName): Texture {
        if (!textureName || textureName.length === 0) {
            throw 'textureName must not be undefined, null or empty - was ' + textureName
        }
        const lTextureName = textureName.toLowerCase()
        const lSharedTextureName = 'world/shared/' + getFilename(lTextureName)
        let imgData = this.getResource(lTextureName) || this.getResource(lSharedTextureName)
        if (!imgData) {
            console.warn('Texture \'' + textureName + '\' (' + lTextureName + ', ' + lSharedTextureName + ') unknown! Using placeholder texture instead')
            ResourceManager.resourceByName[lTextureName] = imgData = createDummyImgData(64, 64)
        }
        const texture = new Texture(imgData, Texture.DEFAULT_MAPPING, RepeatWrapping, RepeatWrapping)
        texture.needsUpdate = true
        return texture
    }

    static getMap(name: string) {
        return name ? this.getResource(name) : null
    }

    static getAnimationEntityType(aeFilename: string): AnimationEntityType {
        let cfgRoot = this.getResource(aeFilename)
        if (!cfgRoot) throw 'Could not get animation entity type for: ' + aeFilename
        return AnimEntityLoader.loadModels(aeFilename, cfgRoot)
    }

    static getBitmapFont(name: string): BitmapFont {
        const fontImageData = this.getResource(name)
        if (!fontImageData) throw 'Could not load font image data for: ' + name
        ResourceManager.fontCache[name] = ResourceManager.fontCache[name] || new BitmapFont(fontImageData)
        return ResourceManager.fontCache[name]
    }

    static getDefaultFont() {
        return ResourceManager.getBitmapFont('Interface/Fonts/Font5_Hi.bmp')
    }
}
