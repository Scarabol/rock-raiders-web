import { RepeatWrapping, SRGBColorSpace, Texture } from 'three'
import { getFilename, getPath } from '../core/Util'
import { VERBOSE } from '../params'
import { SceneMesh } from '../scene/SceneMesh'
import { LWOBParser, LWOBTextureLoader } from './fileparser/LWOBParser'
import { ResourceCache } from './ResourceCache'
import { LWSCData, LWSCParser } from './fileparser/LWSCParser'
import { AnimEntityData, AnimEntityParser } from './AnimEntityParser'
import { UVData } from './fileparser/LWOUVParser'

export class ResourceManager extends ResourceCache {
    static lwoCache: Map<string, SceneMesh> = new Map()
    static lwscCache: Map<string, LWSCData> = new Map()
    static aeCache: Map<string, AnimEntityData> = new Map()

    static getTexturesBySequenceName(basename: string): Texture[] {
        const lBasename = basename?.toLowerCase()
        const result: string[] = []
        this.resourceByName.forEach((res, name) => {
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

    static getMeshTexture(textureFilename: string, meshPath: string, entityPath: string): Texture {
        const lTextureFilename = textureFilename?.toLowerCase()
        const lMeshFilepath = meshPath?.toLowerCase() + lTextureFilename
        const imgData = this.resourceByName.getOrUpdate(lMeshFilepath, () => {
            const lEntityFilepath = entityPath ? entityPath.toLowerCase() + lTextureFilename : null
            if (entityPath) {
                return this.resourceByName.getOrUpdate(lEntityFilepath, () => {
                    return this.getTextureImageDataFromSharedPaths(lTextureFilename, textureFilename, lMeshFilepath, lEntityFilepath)
                })
            } else {
                return this.getTextureImageDataFromSharedPaths(lTextureFilename, textureFilename, lMeshFilepath, lEntityFilepath)
            }
        })
        if (!imgData) return null
        // without repeat wrapping some entities are not fully textured
        const texture = new Texture(imgData, Texture.DEFAULT_MAPPING, RepeatWrapping, RepeatWrapping)
        texture.needsUpdate = true // without everything is just dark
        texture.colorSpace = SRGBColorSpace
        return texture
    }

    private static getTextureImageDataFromSharedPaths(lTextureFilename: string, textureFilename: string, lMeshFilepath: string, lEntityFilepath: string): ImageData {
        const ugSharedFilename = `vehicles/sharedug/${lTextureFilename}`
        return this.resourceByName.getOrUpdate(ugSharedFilename, () => {
            const worldSharedFilename = `world/shared/${lTextureFilename}`
            return this.resourceByName.getOrUpdate(worldSharedFilename, () => {
                if (VERBOSE) console.log(`Image data for '${textureFilename}' not found at '${lMeshFilepath}', '${lEntityFilepath}' or '${worldSharedFilename}'`)
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
            if (VERBOSE) console.warn(`Could not find texture '${textureFilepath}'`)
            return null
        }
        // without repeat wrapping some entities are not fully textured
        const texture = new Texture(imgData, Texture.DEFAULT_MAPPING, RepeatWrapping, RepeatWrapping)
        texture.name = textureFilepath
        texture.needsUpdate = true // without everything is just dark
        texture.colorSpace = SRGBColorSpace
        return texture
    }

    static getLwoModel(lwoFilepath: string, entityPath: string = null): SceneMesh {
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
                    const textureLoader = new ResourceManagerTextureLoader(getPath(sharedLwoFilepath), entityPath)
                    const uvFilepath = sharedLwoFilepath.replace('.lwo', '.uv')
                    const uvData = ResourceManager.getResource(uvFilepath) as UVData[]
                    return new LWOBParser(sharedLwoFilepath, sharedLwoBuffer, textureLoader, uvData).parse()
                })
            }
            const textureLoader = new ResourceManagerTextureLoader(getPath(lwoFilepath), entityPath)
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
            const texture = ResourceManager.getMeshTexture(textureFilename, this.meshPath, this.entityPath)
            if (!texture && VERBOSE) console.log(`Could not get mesh texture "${textureFilename}" from mesh path '${this.meshPath}' or entity path '${this.entityPath}'`)
            return texture ? [texture] : []
        }
    }
}
