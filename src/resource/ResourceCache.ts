import { GameConfig } from '../cfg/GameConfig'
import { Cursor } from './Cursor'
import { BitmapFont, BitmapFontData } from '../core/BitmapFont'
import { createContext, createDummyImgData, imgDataToContext } from '../core/ImageHelper'
import { SpriteImage } from '../core/Sprite'
import { iGet } from '../core/Util'
import { AnimatedCursor } from '../screen/AnimatedCursor'
import { cacheGetData, cachePutData } from './AssetCacheHelper'
import { EntityType } from '../game/model/EntityType'
import { EntityDependencyChecked } from '../gui/main/IconPanelButton'
import { DEFAULT_FONT_NAME, TOOLTIP_FONT_NAME } from '../params'

export class ResourceCache {
    static readonly fontCache: Map<string, BitmapFont> = new Map()
    static readonly cursorToUrl: Map<Cursor, AnimatedCursor> = new Map()
    static readonly imageCache: Map<string, SpriteImage> = new Map()
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

    static getBitmapFont(name: string): BitmapFont {
        return this.fontCache.getOrUpdate(name, () => {
            const fontData = this.getResource(name) as BitmapFontData
            if (!fontData) throw new Error(`Could not load font image data for: ${name}`)
            return new BitmapFont(fontData)
        })
    }

    static getDefaultFont(): BitmapFont {
        return this.getBitmapFont(DEFAULT_FONT_NAME)
    }

    static getTooltipFont(): BitmapFont {
        return this.getBitmapFont(TOOLTIP_FONT_NAME)
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
                this.cursorToUrl.set(cursor, new AnimatedCursor(animatedCursorData.dataUrls, animatedCursorData.maxHeight))
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
            this.cursorToUrl.set(cursor, new AnimatedCursor(animatedCursorData.dataUrls, animatedCursorData.maxHeight))
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

    static createDependenciesSprite(dependencies: EntityDependencyChecked[]): SpriteImage {
        let totalWidth = 0
        let totalHeight = 0
        const deps = dependencies.map((dep) => {
            let cfg
            if (dep.entityType === EntityType.PILOT) {
                cfg = this.cfg('InterfaceImages', 'Interface_MenuItem_TeleportMan')
            } else {
                cfg = this.cfg('InterfaceBuildImages', dep.itemKey)
            }
            const imageName = dep.isOk ? cfg[0] : cfg[1]
            const depImg = this.getImage(imageName)
            totalWidth += depImg.width
            totalHeight = Math.max(totalHeight, depImg.height)
            return {img: depImg, level: dep.minLevel}
        })
        const plusSignImg = this.getImage('Interface/Dependencies/+.bmp')
        totalWidth += plusSignImg.width * (deps.length - 1)
        const equalsSignImg = this.getImage('Interface/Dependencies/=.bmp')
        totalWidth += equalsSignImg.width * 2
        const dependencySprite = createContext(totalWidth, totalHeight)
        let posX = 0
        deps.forEach((s, index) => {
            dependencySprite.drawImage(s.img, posX, (totalHeight - s.img.height) / 2)
            if (s.level) {
                const upgradeName = this.configuration.upgradeNames[s.level - 1]
                if (upgradeName) {
                    const minLevelImg = this.getTooltipFont().createTextImage(upgradeName)
                    dependencySprite.drawImage(minLevelImg, posX + 3, (totalHeight - s.img.height) / 2 + 3)
                }
            }
            posX += s.img.width
            const signImg = index === deps.length - 1 ? equalsSignImg : plusSignImg
            dependencySprite.drawImage(signImg, posX, (totalHeight - signImg.height) / 2)
            posX += signImg.width
        })
        return dependencySprite.canvas
    }
}
