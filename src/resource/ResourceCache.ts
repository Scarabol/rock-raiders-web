import { GameConfig } from '../cfg/GameConfig'
import { Cursor } from '../cfg/PointerCfg'
import { BitmapFont, BitmapFontData } from '../core/BitmapFont'
import { createContext, createDummyImgData, imgDataToContext } from '../core/ImageHelper'
import { SpriteContext, SpriteImage } from '../core/Sprite'
import { iGet } from '../core/Util'
import { AnimatedCursor } from '../screen/AnimatedCursor'
import { cacheGetData, cachePutData } from './AssetCacheHelper'

export class ResourceCache {
    static configuration: GameConfig = new GameConfig()
    static resourceByName: Map<string, any> = new Map()
    static fontCache: Map<string, BitmapFont> = new Map()
    static cursorToUrl: Map<Cursor, AnimatedCursor> = new Map()

    static cfg(...keys: string[]): any {
        return iGet(this.configuration, ...keys)
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
        if (imageName.toLowerCase().endsWith('/loading.bmp') || imageName.toLowerCase().endsWith('/menubgpic.bmp')) {
            this.drawCopyrightCover(context)
        }
        return context.canvas
    }

    private static drawCopyrightCover(context: SpriteContext) {
        context.fillStyle = '#f00'
        context.fillRect(38, 9, 131, 131)
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

    static getTooltipFont(): BitmapFont {
        return this.getBitmapFont('Interface/Fonts/tooltipfont.bmp')
    }

    static async loadDefaultCursor() {
        const cursorImageName = this.configuration.pointers.pointerStandard
        await this.loadCursor(cursorImageName, 'pointerStandard')
    }

    static async loadAllCursor() {
        const blankPointerFilename = this.configuration.pointers.pointerBlank
        const blankPointerImageData = this.getImageData(blankPointerFilename)
        await Promise.all(Object.entries(this.configuration.pointers).map(([objKey, cursorCfg]) => {
            const cursor = objKey as Cursor
            if (Array.isArray(cursorCfg)) {
                const cursorImageName = cursorCfg[0]
                return cacheGetData(cursorImageName).then((animatedCursorData) => {
                    if (!animatedCursorData) {
                        let maxHeight = 0
                        const cursorImages = (this.getResource(cursorImageName) as ImageData[]).map((imgData) => {
                            const context = imgDataToContext(blankPointerImageData)
                            context.drawImage(imgDataToContext(imgData).canvas, Math.round((blankPointerImageData.width - imgData.width) / 2), Math.round((blankPointerImageData.height - imgData.height) / 2))
                            maxHeight = Math.max(maxHeight, context.canvas.height)
                            return context.canvas
                        })
                        animatedCursorData = {
                            dataUrls: this.cursorToDataUrl(cursorImages),
                            maxHeight: maxHeight,
                        }
                        cachePutData(cursorImageName, animatedCursorData).then()
                    }
                    this.cursorToUrl.set(cursor, new AnimatedCursor(animatedCursorData.dataUrls, animatedCursorData.maxHeight))
                })
            } else {
                return this.loadCursor(cursorCfg, cursor)
            }
        }))
    }

    private static async loadCursor(cursorImageName: string, cursor: Cursor) {
        return cacheGetData(cursorImageName).then((animatedCursorData) => {
            if (!animatedCursorData) {
                const imgData = this.getImageData(cursorImageName)
                animatedCursorData = {
                    dataUrls: this.cursorToDataUrl(imgDataToContext(imgData).canvas),
                    maxHeight: imgData.height,
                }
                cachePutData(cursorImageName, animatedCursorData).then()
            }
            this.cursorToUrl.set(cursor, new AnimatedCursor(animatedCursorData.dataUrls, animatedCursorData.maxHeight))
        })
    }

    private static cursorToDataUrl(cursorImages: HTMLCanvasElement | HTMLCanvasElement[]) {
        return Array.ensure(cursorImages).map((c) => `url(${c.toDataURL()}), auto`)
    }

    static getCursor(cursor: Cursor): AnimatedCursor {
        return this.cursorToUrl.get(cursor)
    }
}
