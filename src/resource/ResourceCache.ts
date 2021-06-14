import { GameStatsCfg } from '../cfg/GameStatsCfg'
import { LevelsCfg } from '../cfg/LevelsCfg'
import { BitmapFont } from '../core/BitmapFont'
import { createContext, createDummyImgData } from '../core/ImageHelper'
import { iGet } from '../core/Util'
import { AnimatedCursor } from '../screen/AnimatedCursor'
import { allCursor, Cursor } from '../screen/Cursor'

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

    static loadDefaultCursor() {
        const imageName = iGet(this.cfg('Pointers'), Cursor[Cursor.Pointer_Standard])
        const cursorImage = this.getCursorImage(imageName)
        this.cursorToUrl.set(Cursor.Pointer_Standard, new AnimatedCursor(cursorImage))
    }

    static loadAllCursor() {
        const pointersCfg = this.cfg('Pointers')
        const blankPointerFilename = iGet(pointersCfg, Cursor[Cursor.Pointer_Blank])
        const blankPointerImageData = this.getImageData(blankPointerFilename)
        allCursor.forEach((cursor) => {
            const cursorCfg = iGet(pointersCfg, Cursor[cursor])
            if (Array.isArray(cursorCfg)) {
                const cursorImages = (this.getResource(cursorCfg[0]) as ImageData[]).map((imgData) => {
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
                this.cursorToUrl.set(cursor, new AnimatedCursor(cursorImages))
            } else {
                const cursorImage = this.getCursorImage(cursorCfg)
                this.cursorToUrl.set(cursor, new AnimatedCursor(cursorImage))
            }
        })
    }

    static getCursorImage(imageName: string): HTMLCanvasElement {
        const imgData = this.getImageData(imageName)
        const canvas = document.createElement('canvas')
        canvas.setAttribute('width', imgData.width.toString())
        canvas.setAttribute('height', imgData.height.toString())
        canvas.getContext('2d').putImageData(imgData, 0, 0)
        return canvas
    }

    static getCursor(cursor: Cursor): AnimatedCursor {
        return this.cursorToUrl.get(cursor)
    }

}
