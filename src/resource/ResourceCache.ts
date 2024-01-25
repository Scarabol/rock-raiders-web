import { GameConfig } from '../cfg/GameConfig'
import { Cursor } from './Cursor'
import { createCanvas, createContext, createDummyImgData, imgDataToCanvas } from '../core/ImageHelper'
import { SpriteImage } from '../core/Sprite'
import { AnimatedCursor } from '../screen/AnimatedCursor'
import { cacheGetData, cachePutData } from './AssetCacheHelper'
import { CursorManager } from '../screen/CursorManager'

export class ResourceCache {
    static readonly imageCache: Map<string, SpriteImage> = new Map()
    static readonly resourceByName: Map<string, any> = new Map()

    static getResource(resourceName: string): any {
        const lName = resourceName?.toString()?.toLowerCase() || null
        return this.resourceByName.get(lName) || null
    }

    static getImage(imageName: string): SpriteImage {
        return this.imageCache.getOrUpdate(imageName, () => {
            return this.createImage(imageName)
        })
    }

    private static createImage(imageName: string): SpriteImage {
        const imgData = this.getImageData(imageName)
        const context = createContext(imgData.width, imgData.height)
        context.putImageData(imgData, 0, 0)
        // TODO Loading screen background should be cached to be able to be shown earlier
        if (imageName.toLowerCase().endsWith('/loading.bmp') || imageName.toLowerCase().endsWith('/menubgpic.bmp')) {
            context.fillStyle = '#f00'
            context.fillRect(38, 9, 131, 131)
        }
        return context.canvas
    }

    static getImageData(imageName: string): ImageData {
        if (!imageName) throw new Error(`imageName must not be undefined, null or empty - was ${imageName}`)
        return this.resourceByName.getOrUpdate((imageName.toLowerCase()), () => {
            console.error(`Image '${imageName}' unknown! Using placeholder image instead`)
            return createDummyImgData(64, 64)
        })
    }

    static getImageOrNull(imageName: string): SpriteImage | null {
        return imageName ? this.getImage(imageName) : null
    }

    static async loadAllCursor() {
        const blankPointerFilename = GameConfig.instance.pointers.get(Cursor.BLANK)
        const blankPointerImageData = this.getImageData(blankPointerFilename)
        const loadingCursors: Promise<void>[] = []
        GameConfig.instance.pointers.forEach((cursorFileName, cursor) => {
            if (cursorFileName.toLowerCase().endsWith('.bmp')) {
                loadingCursors.push(this.loadCursor(cursorFileName, cursor))
                return
            }
            loadingCursors.push(cacheGetData(cursorFileName).then((animatedCursorData) => {
                if (!animatedCursorData) {
                    let maxHeight = 0
                    const cursorImages = (this.getResource(cursorFileName) as ImageData[]).map((imgData) => {
                        const blankCanvas = createCanvas(blankPointerImageData.width, blankPointerImageData.height)
                        const context = blankCanvas.getContext('2d')
                        context.putImageData(blankPointerImageData, 0, 0)
                        const cursorCanvas = imgDataToCanvas(imgData)
                        const x = Math.round((blankPointerImageData.width - imgData.width) / 2)
                        const y = Math.round((blankPointerImageData.height - imgData.height) / 2)
                        context.drawImage(cursorCanvas, x, y)
                        maxHeight = Math.max(maxHeight, context.canvas.height)
                        return context.canvas
                    })
                    animatedCursorData = {
                        dataUrls: this.cursorToDataUrl(cursorImages),
                        maxHeight: maxHeight,
                    }
                    cachePutData(cursorFileName, animatedCursorData).then()
                }
                CursorManager.cursorToUrl.set(cursor, new AnimatedCursor(animatedCursorData.dataUrls))
            }))
        })
        await Promise.all(loadingCursors)
    }

    static async loadCursor(cursorImageName: string, cursor: Cursor) {
        return cacheGetData(cursorImageName).then((animatedCursorData) => {
            if (!animatedCursorData) {
                const imgData = this.getImageData(cursorImageName)
                const canvas = createCanvas(imgData.width, imgData.height)
                canvas.getContext('2d').putImageData(imgData, 0, 0)
                animatedCursorData = {
                    dataUrls: this.cursorToDataUrl(canvas),
                    maxHeight: imgData.height,
                }
                cachePutData(cursorImageName, animatedCursorData).then()
            }
            CursorManager.cursorToUrl.set(cursor, new AnimatedCursor(animatedCursorData.dataUrls))
        })
    }

    private static cursorToDataUrl(cursorImages: HTMLCanvasElement | HTMLCanvasElement[]) {
        return Array.ensure(cursorImages).map((c) => `url(${c.toDataURL()}), auto`)
    }
}
