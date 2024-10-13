import { RepeatWrapping, SRGBColorSpace, Texture } from 'three'
import { getFilename, getPath } from '../core/Util'
import { VERBOSE } from '../params'
import { SceneMesh } from '../scene/SceneMesh'
import { LWOBParser, LWOBTextureLoader } from './fileparser/LWOBParser'
import { LWSCData } from './fileparser/LWSCParser'
import { AnimEntityData } from './AnimEntityParser'
import { UVData } from './fileparser/LWOUVParser'
import { SpriteImage } from '../core/Sprite'
import { createCanvas, createContext, createDummyImgData, imgDataToCanvas } from '../core/ImageHelper'
import { GameConfig } from '../cfg/GameConfig'
import { Cursor, CURSOR } from './Cursor'
import { cacheGetData, cachePutData } from './AssetCacheHelper'
import { CursorManager } from '../screen/CursorManager'
import { AnimatedCursorData } from '../screen/AnimatedCursor'

export class ResourceManager {
    static readonly resourceByName: Map<string, any> = new Map()
    static readonly imageCache: Map<string, SpriteImage> = new Map()
    static readonly lwoCache: Map<string, SceneMesh> = new Map()

    static getResource(resourceName: string): any {
        const lName = resourceName?.toString()?.toLowerCase() || undefined
        if (!lName) return undefined
        return this.resourceByName.get(lName) || undefined
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

    static getImageOrNull(imageName: string): SpriteImage | undefined {
        return imageName ? this.getImage(imageName) : undefined
    }

    static async loadAllCursor() {
        const blankPointerFilename = GameConfig.instance.pointers.get(CURSOR.BLANK)
        if (!blankPointerFilename) throw new Error('Could not determine blank pointer filename')
        const blankPointerImageData = this.getImageData(blankPointerFilename)
        const loadingCursors: Promise<void>[] = []
        GameConfig.instance.pointers.forEach((cursorFileName, cursor) => {
            if (cursorFileName.toLowerCase().endsWith('.bmp')) {
                loadingCursors.push(this.loadCursor(cursorFileName, cursor))
                return
            }
            loadingCursors.push(cacheGetData(cursorFileName).then((animatedCursorData) => {
                if (!animatedCursorData) {
                    const cursorImages = (this.getResource(cursorFileName) as ImageData[]).map((imgData) => {
                        const blankCanvas = createCanvas(blankPointerImageData.width, blankPointerImageData.height)
                        const context = blankCanvas.getContext('2d')
                        if (!context) throw new Error('Could not init context for cursor canvas')
                        context.putImageData(blankPointerImageData, 0, 0)
                        const cursorCanvas = imgDataToCanvas(imgData)
                        const x = Math.round((blankPointerImageData.width - imgData.width) / 2)
                        const y = Math.round((blankPointerImageData.height - imgData.height) / 2)
                        context.drawImage(cursorCanvas, x, y)
                        return context.canvas
                    })
                    animatedCursorData = new AnimatedCursorData(cursorImages)
                    cachePutData(cursorFileName, animatedCursorData).then()
                }
                CursorManager.addCursor(cursor, animatedCursorData.dataUrls)
            }))
        })
        await Promise.all(loadingCursors)
    }

    static async loadCursor(cursorImageName: string, cursor: Cursor) {
        let animatedCursorData = await cacheGetData(cursorImageName)
        if (!animatedCursorData) {
            const imgData = this.getImageData(cursorImageName)
            const cursorImage = createCanvas(imgData.width, imgData.height)
            const context = cursorImage.getContext('2d')
            if (!context) {
                console.warn('Could not get context to draw cursor on canvas')
            } else {
                context.putImageData(imgData, 0, 0)
            }
            animatedCursorData = new AnimatedCursorData([cursorImage])
            cachePutData(cursorImageName, animatedCursorData).then()
        }
        CursorManager.addCursor(cursor, animatedCursorData.dataUrls)
    }

    static getTexturesBySequenceName(basename: string): Texture[] {
        const lBasename = basename?.toLowerCase()
        const result: string[] = []
        this.resourceByName.forEach((_, name) => {
            if (name.match(`${lBasename}\\d+`)) result.push(name)
        })
        result.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
        if (result.length > 0) {
            return result.map((textureFilepath) => this.getTexture(textureFilepath))
        } else if (!lBasename.startsWith('world/shared/')) {
            return this.getTexturesBySequenceName(`world/shared/${getFilename(lBasename)}`)
        } else {
            console.log(`Texture sequence not found: ${lBasename}`)
            return []
        }
    }

    static getMeshTexture(textureFilepath: string, meshPath: string): Texture[] {
        const lTextureFilename = textureFilepath?.toLowerCase()
        const lMeshFilepath = meshPath?.toLowerCase() + lTextureFilename
        const imgData = this.resourceByName.getOrUpdate(lMeshFilepath, () => {
            return this.getTextureImageDataFromSharedPaths(lTextureFilename)
        })
        const texture = this.createTexture(imgData, textureFilepath)
        return texture ? [texture] : []
    }

    private static getTextureImageDataFromSharedPaths(lTextureFilename: string): ImageData {
        const ugSharedFilename = `vehicles/sharedug/${lTextureFilename}`
        return this.resourceByName.getOrUpdate(ugSharedFilename, () => {
            const worldSharedFilename = `world/shared/${lTextureFilename}`
            return this.resourceByName.getOrUpdate(worldSharedFilename, () => {
                return null
            })
        })
    }

    static getTexture(textureFilepath: string): Texture | undefined {
        if (!textureFilepath) {
            throw new Error(`textureFilepath must not be undefined, null or empty - was ${textureFilepath}`)
        }
        const imgData = this.resourceByName.get(textureFilepath.toLowerCase())
        return this.createTexture(imgData, textureFilepath)
    }

    private static createTexture(imgData: ImageData, textureFilepath: string) {
        if (!imgData) {
            // ignore known texture issues
            if (VERBOSE || !['teofoilreflections.jpg', 'wingbase3.bmp', 'a_side.bmp', 'a_top.bmp', 'sand.bmp', 'display.bmp'].includes(textureFilepath)) {
                console.warn(`Could not find texture ${textureFilepath}`)
            }
            return undefined
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
                    const uvData = ResourceManager.getResource(uvFilepath) as UVData
                    return new LWOBParser(sharedLwoFilepath, sharedLwoBuffer, textureLoader, uvData).parse()
                })
            }
            textureLoader.setMeshPath(getPath(lwoFilepath))
            const uvFilepath = lwoFilepath.replace('.lwo', '.uv')
            const uvData = ResourceManager.getResource(uvFilepath) as UVData
            return new LWOBParser(lwoFilepath, lwoBuffer, textureLoader, uvData).parse()
        })?.clone()
    }

    static getLwscData(lwscFilepath: string): LWSCData {
        lwscFilepath = lwscFilepath.toLowerCase()
        if (!lwscFilepath.endsWith('.lws')) lwscFilepath += '.lws'
        const lwscData = ResourceManager.getResource(lwscFilepath)
        if (!lwscData) throw new Error(`Could not get LWSC data for '${lwscFilepath}'`)
        return lwscData
    }

    static getAnimatedData(aeName: string): AnimEntityData {
        const aeFilename = `${aeName}/${aeName.split('/').last()}.ae`
        const animData = ResourceManager.getResource(aeFilename)
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

    load(textureFilename: string, onLoad: (textures: Texture[]) => void): void {
        onLoad(this.loadFromResourceManager(textureFilename))
    }

    private loadFromResourceManager(textureFilename: string): Texture[] {
        if (!textureFilename || textureFilename === '(none)') return []
        const hasSequence = textureFilename.endsWith('(sequence)')
        if (hasSequence) textureFilename = textureFilename.slice(0, textureFilename.length - '(sequence)'.length).trim()
        const alphaIndexMatch = textureFilename.match(/(.*a)(\d+)(_.+)/i)
        if (alphaIndexMatch) textureFilename = alphaIndexMatch[1] + alphaIndexMatch[3]
        if (hasSequence) {
            const match = textureFilename.match(/(.+\D)0+(\d+)\..+/i)
            return ResourceManager.getTexturesBySequenceName(this.meshPath + match[1])
        } else {
            return ResourceManager.getMeshTexture(textureFilename, this.meshPath)
        }
    }
}
