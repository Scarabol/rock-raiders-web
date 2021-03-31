import ResourceWorker from 'worker-loader!./wadworker/Resources'
import { RepeatWrapping, Texture } from 'three'
import { AnimationEntityType } from '../scene/model/anim/AnimationEntityType'
import { InitLoadingMessage } from './wadworker/InitLoadingMessage'
import { createContext, createDummyImgData } from '../core/ImageHelper'
import { iGet } from './wadworker/WadUtil'
import { getFilename } from '../core/Util'
import { AnimEntityLoader } from './AnimEntityLoader'
import { BitmapFont } from '../core/BitmapFont'

export class ResourceManager {

    static worker: ResourceWorker = new ResourceWorker()
    static configuration: any = {}
    static resourceByName: {} = {}

    static startLoadingFromCache() {
        return this.startLoading(null)
    }

    static startLoadingFromUrl(wad0Url: string, wad1Url: string) {
        return this.startLoading(new InitLoadingMessage(wad0Url, wad1Url))
    }

    private static startLoading(msg: InitLoadingMessage) {
        this.worker.onmessage = (event) => {
            const data = event.data
            if (data.hasOwnProperty('msg')) {
                this.onMessage(data.msg)
            } else if (data.hasOwnProperty('cfg')) {
                this.configuration = data.cfg
                this.onInitialLoad(data.totalResources)
            } else if (data.hasOwnProperty('cacheMissed')) {
                this.onCacheMissed()
            } else if (data.hasOwnProperty('assetIndex')) {
                this.resourceByName[data.assetName.toLowerCase()] = data.assetObj
                this.onAssetLoaded(data.assetIndex)
            } else if (data.hasOwnProperty('done')) {
                console.log('Loading of about ' + data.totalResources + ' assets complete! Total load time: ' + data.loadingTimeSeconds + ' seconds.')
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

    static onAssetLoaded: (assetIndex: number) => any = () => {
    }

    static onLoadDone: () => any = () => {
    }

    static cfg(...keys: string[]): any {
        return iGet(ResourceManager.configuration, ...keys)
    }

    static filterTextureSequenceNames(basename: string): string[] {
        const lBasename = basename.toLowerCase()
        const result = Object.keys(this.resourceByName).filter((name) => name.startsWith(lBasename))
        return result.length > 0 ? result : ResourceManager.filterTextureSequenceNames('world/shared/' + getFilename(basename))
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
            console.error('Texture \'' + textureName + '\' (' + lTextureName + ', ' + lSharedTextureName + ') unknown! Using placeholder texture instead')
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

    static getBitmapFont(name: string) {
        return new BitmapFont(this.getResource(name))
    }

}
