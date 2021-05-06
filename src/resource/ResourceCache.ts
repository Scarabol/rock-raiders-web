import { GameStatsCfg } from '../cfg/GameStatsCfg'
import { BitmapFont } from '../core/BitmapFont'
import { createContext, createDummyImgData } from '../core/ImageHelper'
import { iGet } from '../core/Util'

export class ResourceCache {

    static configuration: any = {}
    static resourceByName: Map<string, any> = new Map()
    static fontCache: Map<string, BitmapFont> = new Map()
    static stats: GameStatsCfg

    static cfg(...keys: string[]): any {
        return iGet(this.configuration, ...keys)
    }

    static getResource(resourceName: string): any {
        const lName = resourceName?.toString()?.toLowerCase() || null
        return this.resourceByName.get(lName) || null
    }

    static getImageData(imageName: string): ImageData {
        if (!imageName) throw 'imageName must not be undefined, null or empty - was ' + imageName
        return this.resourceByName.getOrUpdate((imageName.toLowerCase()), () => {
            console.error('Image \'' + imageName + '\' unknown! Using placeholder image instead')
            return createDummyImgData(64, 64)
        })
    }

    static getImage(imageName: string): HTMLCanvasElement {
        const imgData = this.getImageData(imageName)
        const context: CanvasRenderingContext2D = createContext(imgData.width, imgData.height)
        context.putImageData(imgData, 0, 0)
        return context.canvas
    }

    static getImageOrNull(imageName: string): HTMLCanvasElement | null {
        return imageName ? this.getImage(imageName) : null
    }

    static getBitmapFont(name: string): BitmapFont {
        return this.fontCache.getOrUpdate(name, () => {
            const fontImageData = this.getResource(name)
            if (!fontImageData) throw 'Could not load font image data for: ' + name
            return new BitmapFont(fontImageData)
        })
    }

    static getDefaultFont() {
        return this.getBitmapFont('Interface/Fonts/Font5_Hi.bmp')
    }

}
