import { GameStatsCfg } from '../cfg/GameStatsCfg'
import { LevelsCfg } from '../cfg/LevelsCfg'
import { BitmapFont, BitmapFontData } from '../core/BitmapFont'
import { createContext, createDummyImgData } from '../core/ImageHelper'
import { asArray, iGet } from '../core/Util'
import { EntityType } from '../game/model/EntityType'
import { AnimatedCursor } from '../screen/AnimatedCursor'
import { allCursor, Cursor } from '../screen/Cursor'
import { cacheGetData, cachePutData } from './assets/AssetCacheHelper'

export class ResourceCache {

    static configuration: any = {}
    static resourceByName: Map<string, any> = new Map()
    static fontCache: Map<string, BitmapFont> = new Map()
    static stats: GameStatsCfg
    static cursorToUrl: Map<Cursor, AnimatedCursor> = new Map()
    static sfxByKey: Map<string, any> = new Map()

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
        if (!imageName) throw new Error(`imageName must not be undefined, null or empty - was ${imageName}`)
        return this.resourceByName.getOrUpdate((imageName.toLowerCase()), () => {
            console.error(`Image '${imageName}' unknown! Using placeholder image instead`)
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
            const fontData = this.getResource(name) as BitmapFontData
            if (!fontData) throw new Error(`Could not load font image data for: ${name}`)
            return new BitmapFont(fontData)
        })
    }

    static getDefaultFont(): BitmapFont {
        return this.getBitmapFont('Interface/Fonts/Font5_Hi.bmp')
    }

    static async loadDefaultCursor() {
        const cursorImageName = iGet(this.cfg('Pointers'), Cursor[Cursor.Pointer_Standard])
        await this.loadCursor(cursorImageName, Cursor.Pointer_Standard)
    }

    static async loadAllCursor() {
        const pointersCfg = this.cfg('Pointers')
        const blankPointerFilename = iGet(pointersCfg, Cursor[Cursor.Pointer_Blank])
        const blankPointerImageData = this.getImageData(blankPointerFilename)
        await Promise.all(allCursor.map((cursor) => {
            const cursorCfg = iGet(pointersCfg, Cursor[cursor])
            if (Array.isArray(cursorCfg)) {
                const cursorImageName = cursorCfg[0]
                return cacheGetData(cursorImageName).then((cursorDataUrls) => {
                    if (!cursorDataUrls) {
                        const cursorImages = (this.getResource(cursorImageName) as ImageData[]).map((imgData) => {
                            const canvas = document.createElement('canvas')
                            canvas.setAttribute('width', blankPointerImageData.width.toString())
                            canvas.setAttribute('height', blankPointerImageData.height.toString())
                            const context = canvas.getContext('2d')
                            context.putImageData(blankPointerImageData, 0, 0)
                            const animContext = createContext(imgData.width, imgData.height)
                            animContext.putImageData(imgData, 0, 0)
                            context.drawImage(animContext.canvas, Math.round((blankPointerImageData.width - imgData.width) / 2), Math.round((blankPointerImageData.height - imgData.height) / 2))
                            return context.canvas
                        })
                        cursorDataUrls = this.cursorToDataUrl(cursorImages)
                        cachePutData(cursorImageName, cursorDataUrls).then()
                    }
                    this.cursorToUrl.set(cursor, new AnimatedCursor(cursorDataUrls))
                })
            } else {
                return this.loadCursor(cursorCfg, cursor)
            }
        }))
    }

    private static async loadCursor(cursorImageName: string, cursor: Cursor) {
        return cacheGetData(cursorImageName).then((cursorDataUrls) => {
            if (!cursorDataUrls) {
                const imgData = this.getImageData(cursorImageName)
                const canvas = document.createElement('canvas')
                canvas.setAttribute('width', imgData.width.toString())
                canvas.setAttribute('height', imgData.height.toString())
                canvas.getContext('2d').putImageData(imgData, 0, 0)
                cursorDataUrls = this.cursorToDataUrl(canvas)
                cachePutData(cursorImageName, cursorDataUrls).then()
            }
            this.cursorToUrl.set(cursor, new AnimatedCursor(cursorDataUrls))
        })
    }

    private static cursorToDataUrl(cursorImages: HTMLCanvasElement | HTMLCanvasElement[]) {
        return asArray(cursorImages).map((c) => `url(${c.toDataURL()}), auto`)
    }

    static getCursor(cursor: Cursor): AnimatedCursor {
        return this.cursorToUrl.get(cursor)
    }

    static getStatsByType(entityType: EntityType) {
        switch (entityType) {
            case EntityType.HOVERBOARD:
                return this.stats.Hoverboard
            case EntityType.SMALL_DIGGER:
                return this.stats.SmallDigger
            case EntityType.SMALL_TRUCK:
                return this.stats.SmallTruck
            case EntityType.SMALL_CAT:
                return this.stats.SmallCat
            case EntityType.SMALL_MLP:
                return this.stats.Smallmlp
            case EntityType.SMALL_HELI:
                return this.stats.SmallHeli
            case EntityType.BULLDOZER:
                return this.stats.Bulldozer
            case EntityType.WALKER_DIGGER:
                return this.stats.WalkerDigger
            case EntityType.LARGE_MLP:
                return this.stats.LargeMLP
            case EntityType.LARGE_DIGGER:
                return this.stats.LargeDigger
            case EntityType.LARGE_CAT:
                return this.stats.LargeCat
            default:
                throw new Error(`Unexpected entity type: ${EntityType[entityType]}`)
        }
    }

}
