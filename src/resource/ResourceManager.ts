import { RepeatWrapping, Texture } from 'three'
import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { createContext } from '../core/ImageHelper'
import { SpriteImage } from '../core/Sprite'
import { getFilename, getPath } from '../core/Util'
import { DEV_MODE } from '../params'
import { SceneMesh } from '../scene/SceneMesh'
import { LWOBParser, LWOBTextureLoader } from './LWOBParser'
import { ResourceCache } from './ResourceCache'

export class ResourceManager extends ResourceCache {
    static lwoCache: Map<string, SceneMesh> = new Map()
    static tooltipSpriteCache: Map<string, SpriteImage> = new Map()

    static getLevelEntryCfg(levelName: string): LevelEntryCfg {
        const levelConf = this.configuration.levels.levelCfgByName.get(levelName)
        if (!levelConf) throw new Error(`Could not find level configuration for "${levelName}"`)
        return levelConf
    }

    static getTexturesBySequenceName(basename: string): Texture[] {
        const lBasename = basename?.toLowerCase()
        const result: string[] = []
        this.resourceByName.forEach((res, name) => {
            if (name.startsWith(lBasename + '0')) result.push(name)
        })
        if (result.length > 0) {
            return result.map((textureFilepath) => this.getTexture(textureFilepath))
        } else if (!lBasename.startsWith('world/shared/')) {
            return this.getTexturesBySequenceName(`world/shared/${getFilename(lBasename)}`)
        } else {
            console.warn(`Texture sequence not found: ${lBasename}`)
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
                    return this.getImgDataFromSharedPaths(lTextureFilename, textureFilename, lMeshFilepath, lEntityFilepath)
                })
            } else {
                return this.getImgDataFromSharedPaths(lTextureFilename, textureFilename, lMeshFilepath, lEntityFilepath)
            }
        })
        if (!imgData) return null
        // without repeat wrapping some entities are not fully textured
        const texture = new Texture(imgData, Texture.DEFAULT_MAPPING, RepeatWrapping, RepeatWrapping)
        texture.needsUpdate = true // without everything is just dark
        return texture
    }

    private static getImgDataFromSharedPaths(lTextureFilename: string, textureFilename: string, lMeshFilepath: string, lEntityFilepath: string): ImageData {
        const ugSharedFilename = `vehicles/sharedug/${lTextureFilename}`
        return this.resourceByName.getOrUpdate(ugSharedFilename, () => {
            const worldSharedFilename = `world/shared/${lTextureFilename}`
            return this.resourceByName.getOrUpdate(worldSharedFilename, () => {
                if (!DEV_MODE) console.warn(`Texture '${textureFilename}' (${lMeshFilepath}, ${lEntityFilepath}, ${worldSharedFilename}) unknown!`)
                return null
            })
        })
    }

    static getTexture(textureFilepath: string): Texture | null {
        if (!textureFilepath) {
            throw new Error(`textureFilepath must not be undefined, null or empty - was ${textureFilepath}`)
        }
        const imgData = this.resourceByName.get(textureFilepath.toLowerCase())
        if (!imgData) return null
        // without repeat wrapping some entities are not fully textured
        const texture = new Texture(imgData, Texture.DEFAULT_MAPPING, RepeatWrapping, RepeatWrapping)
        texture.needsUpdate = true // without everything is just dark
        return texture
    }

    static getLwoModel(lwoFilepath: string, entityPath: string = null): SceneMesh {
        if (!lwoFilepath.endsWith('.lwo')) {
            lwoFilepath += '.lwo'
        }
        return this.lwoCache.getOrUpdate(lwoFilepath.toLowerCase(), () => {
            const lwoBuffer = ResourceManager.getResource(lwoFilepath)
            if (!lwoBuffer) return null
            const textureLoader = new ResourceManagerTextureLoader(getPath(lwoFilepath), entityPath)
            const result = new LWOBParser(lwoBuffer, textureLoader).parse()
            result.name = lwoFilepath
            return result
        })?.clone()
    }

    static getTooltip(tooltipKey: string): SpriteImage {
        return this.tooltipSpriteCache.getOrUpdate(tooltipKey, () => {
            const tooltipText = this.configuration.tooltips.get(tooltipKey)
            if (!tooltipText) return null
            const tooltipTextImage = this.getTooltipFont().createTextImage(tooltipText)
            const margin = 2
            const padding = 2
            const context = createContext(tooltipTextImage.width + 2 * margin + 2 * padding, tooltipTextImage.height + 2 * margin + 2 * padding)
            context.fillStyle = '#001600'
            context.fillRect(0, 0, context.canvas.width, context.canvas.height)
            context.fillStyle = '#006400' // TODO read ToolTipRGB from config
            context.fillRect(0, 0, tooltipTextImage.width + margin + 2 * padding, tooltipTextImage.height + margin + 2 * padding)
            context.fillStyle = '#003200'
            context.fillRect(margin, margin, tooltipTextImage.width + 2 * padding, tooltipTextImage.height + 2 * padding)
            context.drawImage(tooltipTextImage, margin + padding, margin + padding)
            return context.canvas
        })
    }
}

class ResourceManagerTextureLoader extends LWOBTextureLoader {

    load(textureFilename: string, onLoad: (textures: Texture[]) => any): void {
        return onLoad(this.loadFromResourceManager(textureFilename))
    }

    private loadFromResourceManager(textureFilename: string): Texture[] {
        if (!textureFilename || textureFilename === '(none)') return []
        const hasSequence = textureFilename.endsWith('(sequence)')
        const sequenceBaseFilepath = textureFilename.substring(0, textureFilename.length - '(sequence)'.length).trim()
        if (hasSequence) {
            const match = sequenceBaseFilepath.match(/(.+\D)0+(\d+)\..+/i)
            return ResourceManager.getTexturesBySequenceName(this.meshPath + match[1])
        } else {
            const texture = ResourceManager.getMeshTexture(textureFilename, this.meshPath, this.entityPath)
            if (!texture) console.warn(`Could get mesh texture "${textureFilename}" from mesh path "${this.meshPath}" or entity path "${this.entityPath}"`)
            return texture ? [texture] : []
        }
    }
}
