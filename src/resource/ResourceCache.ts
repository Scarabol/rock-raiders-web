import { GameStatsCfg } from '../cfg/GameStatsCfg'
import { LevelsCfg } from '../cfg/LevelsCfg'
import { BitmapFont } from '../core/BitmapFont'
import { createContext, createDummyImgData } from '../core/ImageHelper'
import { iGet } from '../core/Util'
import { AnimatedCursor } from '../screen/AnimatedCursor'
import { Cursor } from '../screen/Cursor'

export class ResourceCache {

    static configuration: any = {}
    static resourceByName: Map<string, any> = new Map()
    static fontCache: Map<string, BitmapFont> = new Map()
    static stats: GameStatsCfg

    static cfg(...keys: string[]): any {
        return iGet(this.configuration, ...keys)
    }

    static getLevelConfig(): LevelsCfg {
        return new LevelsCfg(this.cfg('Levels'))
    }

    static getResource(resourceName: string): any {
        const lName = resourceName?.toString()?.toLowerCase() || null
        return this.resourceByName.get(lName) || null
    }

    static getImageData(imageName: string): ImageData {
        if (!imageName) throw new Error('imageName must not be undefined, null or empty - was ' + imageName)
        return this.resourceByName.getOrUpdate((imageName.toLowerCase()), () => {
            console.error('Image \'' + imageName + '\' unknown! Using placeholder image instead')
            return createDummyImgData(64, 64)
        })
    }

    static getImage(imageName: string): SpriteImage {
        const imgData = this.getImageData(imageName)
        const context = createContext(imgData.width, imgData.height)
        context.putImageData(imgData, 0, 0)
        return context.canvas
    }

    static getImageOrNull(imageName: string): SpriteImage | null {
        return imageName ? this.getImage(imageName) : null
    }

    static getBitmapFont(name: string): BitmapFont {
        return this.fontCache.getOrUpdate(name, () => {
            const fontImageData = this.getResource(name)
            if (!fontImageData) throw new Error('Could not load font image data for: ' + name)
            return new BitmapFont(fontImageData)
        })
    }

    static getDefaultFont(): BitmapFont {
        return this.getBitmapFont('Interface/Fonts/Font5_Hi.bmp')
    }

    static getCursor(cursor: Cursor): AnimatedCursor {
        const pointersCfg = this.cfg('Pointers') // FIXME pre process this
        const cursorCfg = iGet(pointersCfg, Cursor[cursor]) // FIXME and this
        const cursorUrls = this.getResource(cursorCfg)
        return new AnimatedCursor(cursorUrls)
    }

}
