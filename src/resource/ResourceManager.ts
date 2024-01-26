import { RepeatWrapping, SRGBColorSpace, Texture } from 'three'
import { getFilename, getPath } from '../core/Util'
import { VERBOSE } from '../params'
import { SceneMesh } from '../scene/SceneMesh'
import { LWOBParser, LWOBTextureLoader } from './fileparser/LWOBParser'
import { LWSCData, LWSCParser } from './fileparser/LWSCParser'
import { AnimEntityData, AnimEntityParser } from './AnimEntityParser'
import { UVData } from './fileparser/LWOUVParser'
import { SpriteImage } from '../core/Sprite'
import { createCanvas, createContext, createDummyImgData, imgDataToCanvas } from '../core/ImageHelper'
import { GameConfig } from '../cfg/GameConfig'
import { Cursor } from './Cursor'
import { cacheGetData, cachePutData } from './AssetCacheHelper'
import { CursorManager } from '../screen/CursorManager'
import { AnimatedCursor } from '../screen/AnimatedCursor'

export class ResourceManager {
    static readonly imageCache: Map<string, SpriteImage> = new Map()
    static readonly resourceByName: Map<string, any> = new Map()
    static readonly lwoCache: Map<string, SceneMesh> = new Map()
    static readonly lwscCache: Map<string, LWSCData> = new Map()
    static readonly aeCache: Map<string, AnimEntityData> = new Map()

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

    static getTexturesBySequenceName(basename: string): Texture[] {
        const lBasename = basename?.toLowerCase()
        const result: string[] = []
        this.resourceByName.forEach((_, name) => {
            if (name.startsWith(lBasename + '0')) result.push(name)
        })
        result.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
        if (result.length > 0) {
            return result.map((textureFilepath) => this.getTexture(textureFilepath))
        } else if (!lBasename.startsWith('world/shared/')) {
            return this.getTexturesBySequenceName(`world/shared/${getFilename(lBasename)}`)
        } else {
            if (VERBOSE) console.log(`Texture sequence not found: ${lBasename}`)
            return []
        }
    }

    static getMeshTexture(textureFilename: string, meshPath: string): Texture {
        const lTextureFilename = textureFilename?.toLowerCase()
        const lMeshFilepath = meshPath?.toLowerCase() + lTextureFilename
        const imgData = this.resourceByName.getOrUpdate(lMeshFilepath, () => {
            return this.getTextureImageDataFromSharedPaths(lTextureFilename, textureFilename, lMeshFilepath)
        })
        if (!imgData) {
            console.warn(`Could not find texture ${textureFilename}`)
            return null
        }
        // without repeat wrapping some entities are not fully textured
        const texture = new Texture(imgData, Texture.DEFAULT_MAPPING, RepeatWrapping, RepeatWrapping)
        texture.needsUpdate = true // without everything is just dark
        texture.colorSpace = SRGBColorSpace
        return texture
    }

    private static getTextureImageDataFromSharedPaths(lTextureFilename: string, textureFilename: string, lMeshFilepath: string): ImageData {
        const ugSharedFilename = `vehicles/sharedug/${lTextureFilename}`
        return this.resourceByName.getOrUpdate(ugSharedFilename, () => {
            const worldSharedFilename = `world/shared/${lTextureFilename}`
            return this.resourceByName.getOrUpdate(worldSharedFilename, () => {
                console.log(`Image data for '${textureFilename}' not found at '${lMeshFilepath}' or '${worldSharedFilename}'`)
                return null
            })
        })
    }

    static getTexture(textureFilepath: string): Texture | null {
        if (!textureFilepath) {
            throw new Error(`textureFilepath must not be undefined, null or empty - was ${textureFilepath}`)
        }
        const imgData = this.resourceByName.get(textureFilepath.toLowerCase())
        if (!imgData) {
            console.warn(`Could not find texture '${textureFilepath}'`)
            return null
        }
        // without repeat wrapping some entities are not fully textured
        const texture = new Texture(imgData, Texture.DEFAULT_MAPPING, RepeatWrapping, RepeatWrapping)
        texture.name = textureFilepath
        texture.needsUpdate = true // without everything is just dark
        texture.colorSpace = SRGBColorSpace
        return texture
    }

    static getLwoModel(lwoFilepath: string, textureLoader: ResourceManagerTextureLoader = ResourceManagerTextureLoader.instance): SceneMesh {
        if (!lwoFilepath.endsWith('.lwo')) lwoFilepath += '.lwo'
        return this.lwoCache.getOrUpdate(lwoFilepath.toLowerCase(), () => {
            const lwoBuffer = ResourceManager.getResource(lwoFilepath)
            if (!lwoBuffer) {
                const sharedLwoFilepath = `world/shared/${getFilename(lwoFilepath)}`
                return this.lwoCache.getOrUpdate(sharedLwoFilepath.toLowerCase(), () => {
                    const sharedLwoBuffer = ResourceManager.getResource(sharedLwoFilepath)
                    if (!sharedLwoBuffer) {
                        if (VERBOSE) console.warn(`Could not find lwo file neither at ${lwoFilepath} nor at ${sharedLwoFilepath}`)
                        return null
                    }
                    textureLoader.setMeshPath(getPath(sharedLwoFilepath))
                    const uvFilepath = sharedLwoFilepath.replace('.lwo', '.uv')
                    const uvData = ResourceManager.getResource(uvFilepath) as UVData[]
                    return new LWOBParser(sharedLwoFilepath, sharedLwoBuffer, textureLoader, uvData).parse()
                })
            }
            textureLoader.setMeshPath(getPath(lwoFilepath))
            const uvFilepath = lwoFilepath.replace('.lwo', '.uv')
            const uvData = ResourceManager.getResource(uvFilepath) as UVData[]
            return new LWOBParser(lwoFilepath, lwoBuffer, textureLoader, uvData).parse()
        })?.clone()
    }

    static getLwscData(lwscFilepath: string): LWSCData {
        if (!lwscFilepath.endsWith('.lws')) lwscFilepath += '.lws'
        return this.lwscCache.getOrUpdate(lwscFilepath.toLowerCase(), () => {
            const lwscContent = ResourceManager.getResource(lwscFilepath)
            if (!lwscContent) throw new Error(`Could not get LWSC data for '${lwscFilepath}'`)
            return new LWSCParser(lwscContent).parse()
        })
    }

    static getAnimatedData(aeName: string): AnimEntityData {
        const animData = this.aeCache.getOrUpdate(aeName.toLowerCase(), () => {
            const aeFilename = `${aeName}/${aeName.split('/').last()}.ae`
            const cfgRoot = ResourceManager.getResource(aeFilename)
            return !!cfgRoot ? new AnimEntityParser(cfgRoot, `${aeName}/`).parse() : null
        })
        if (!animData) throw new Error(`Could not get animation data for: ${aeName}`)
        return animData
    }
}

class ResourceManagerTextureLoader extends LWOBTextureLoader {
    static readonly instance: ResourceManagerTextureLoader = new ResourceManagerTextureLoader()

    meshPath: string = ''

    setMeshPath(meshPath: string) {
        this.meshPath = meshPath
    }

    load(textureFilename: string, onLoad: (textures: Texture[]) => any): void {
        return onLoad(this.loadFromResourceManager(textureFilename))
    }

    private loadFromResourceManager(textureFilename: string): Texture[] { // TODO Introduce texture name resolver
        if (!textureFilename || textureFilename === '(none)') return []
        const hasSequence = textureFilename.endsWith('(sequence)')
        const sequenceBaseFilepath = textureFilename.slice(0, textureFilename.length - '(sequence)'.length).trim()
        if (hasSequence) {
            const match = sequenceBaseFilepath.match(/(.+\D)0+(\d+)\..+/i)
            return ResourceManager.getTexturesBySequenceName(this.meshPath + match[1])
        } else {
            const texture = ResourceManager.getMeshTexture(textureFilename, this.meshPath)
            if (!texture && VERBOSE) console.log(`Could not get mesh texture "${textureFilename}" from mesh path '${this.meshPath}'`)
            return texture ? [texture] : []
        }
    }
}
