import { EntityDependencyChecked, GameConfig } from '../cfg/GameConfig'
import { Cursor } from './Cursor'
import { BitmapFontData } from '../core/BitmapFont'
import { createContext, createDummyImgData, imgDataToContext } from '../core/ImageHelper'
import { SpriteImage } from '../core/Sprite'
import { iGet } from '../core/Util'
import { AnimatedCursor } from '../screen/AnimatedCursor'
import { cacheGetData, cachePutData } from './AssetCacheHelper'
import { DEFAULT_FONT_NAME, TOOLTIP_FONT_NAME } from '../params'
import { DependencySpriteWorkerPool } from '../worker/DependencySpriteWorkerPool'
import { DependencySpriteWorkerRequestType } from '../worker/DependencySpriteWorker'
import { BitmapFontWorkerPool } from '../worker/BitmapFontWorkerPool'
import { BitmapFontWorkerRequestType } from '../worker/BitmapFontWorker'

export class ResourceCache {
    static readonly bitmapFontWorkerPool: BitmapFontWorkerPool = new BitmapFontWorkerPool()
    static readonly cursorToUrl: Map<Cursor, AnimatedCursor> = new Map()
    static readonly imageCache: Map<string, SpriteImage> = new Map()
    static readonly dependencySpriteWorkerPool: DependencySpriteWorkerPool = new DependencySpriteWorkerPool()
    static readonly dependencySpriteCache: Map<string, SpriteImage> = new Map()
    static configuration: GameConfig = new GameConfig()
    static resourceByName: Map<string, any> = new Map()

    static cfg(...keys: string[]): any {
        return iGet(this.configuration, ...keys)
    }

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

    static startBitmapFontRenderPool() {
        this.bitmapFontWorkerPool.startPool(4, {
            type: BitmapFontWorkerRequestType.ADD_FONT,
            fontName: DEFAULT_FONT_NAME,
            fontData: this.getResource(DEFAULT_FONT_NAME),
        })
    }

    static addFont(fontName: string): Promise<void> {
        return this.bitmapFontWorkerPool.addFont(fontName, this.getResource(fontName))
    }

    static getTooltipText(tooltipKey: string): string {
        if (!tooltipKey) return ''
        return this.configuration.tooltips.get(tooltipKey.toLowerCase())
    }

    static async loadDefaultCursor() {
        const cursorImageName = this.configuration.pointers.get(Cursor.STANDARD) as string
        await this.loadCursor(cursorImageName, Cursor.STANDARD)
    }

    static async loadAllCursor() {
        const blankPointerFilename = this.configuration.pointers.get(Cursor.BLANK) as string
        const blankPointerImageData = this.getImageData(blankPointerFilename)
        const loadingCursors: Promise<void>[] = []
        this.configuration.pointers.forEach((cursorCfg, objKey) => {
            const cursor = objKey as Cursor
            if (!Array.isArray(cursorCfg)) {
                loadingCursors.push(this.loadCursor(cursorCfg, cursor))
                return
            }
            const cursorImageName = cursorCfg[0]
            loadingCursors.push(cacheGetData(cursorImageName).then((animatedCursorData) => {
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
                this.cursorToUrl.set(cursor, new AnimatedCursor(animatedCursorData.dataUrls))
            }))
        })
        await Promise.all(loadingCursors)
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
            this.cursorToUrl.set(cursor, new AnimatedCursor(animatedCursorData.dataUrls))
        })
    }

    private static cursorToDataUrl(cursorImages: HTMLCanvasElement | HTMLCanvasElement[]) {
        return Array.ensure(cursorImages).map((c) => `url(${c.toDataURL()}), auto`)
    }

    static getCursor(cursor: Cursor): AnimatedCursor {
        const result = this.cursorToUrl.get(cursor)
        if (!result) throw new Error(`Cursor ${cursor} not found`)
        return result
    }

    static startDependencySpriteRenderPool() {
        const depInterfaceImageData: Map<string, ImageData[]> = new Map()
        const teleportManConfig = this.configuration.interfaceImages.get('Interface_MenuItem_TeleportMan'.toLowerCase())
        depInterfaceImageData.set('Interface_MenuItem_TeleportMan'.toLowerCase(),
            [this.getImageData(teleportManConfig.normalFile), this.getImageData(teleportManConfig.disabledFile)])
        const depInterfaceBuildImageData: Map<string, ImageData[]> = new Map()
        this.configuration.interfaceBuildImages.forEach((cfg, key) => {
            depInterfaceBuildImageData.set(key, [this.getImageData(cfg.normalFile), this.getImageData(cfg.disabledFile)])
        })
        this.dependencySpriteWorkerPool.startPool(4, {
            type: DependencySpriteWorkerRequestType.SETUP,
            upgradeNames: this.configuration.upgradeNames,
            tooltipFontData: this.getResource(TOOLTIP_FONT_NAME) as BitmapFontData,
            plusSignImgData: this.getImageData('Interface/Dependencies/+.bmp'),
            equalSignImgData: this.getImageData('Interface/Dependencies/=.bmp'),
            interfaceImageData: depInterfaceImageData,
            interfaceBuildImageData: depInterfaceBuildImageData,
        })
    }

    static async createDependenciesSprite(dependencies: EntityDependencyChecked[]): Promise<SpriteImage> {
        const depHash = dependencies.map((d) => `${d.itemKey}:${d.minLevel}=${d.isOk}`).join(';')
        const fromCache = this.dependencySpriteCache.get(depHash)
        if (fromCache) return fromCache
        const imgData = await this.dependencySpriteWorkerPool.createDependenciesSprite(dependencies)
        const dependencyImage = imgDataToContext(imgData).canvas
        this.dependencySpriteCache.set(depHash, dependencyImage)
        return dependencyImage
    }
}
