import { RepeatWrapping, SRGBColorSpace, Texture } from 'three'
import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { createContext } from '../core/ImageHelper'
import { SpriteImage } from '../core/Sprite'
import { getFilename, getPath } from '../core/Util'
import { TOOLTIP_FONT_NAME, VERBOSE } from '../params'
import { SceneMesh } from '../scene/SceneMesh'
import { LWOBParser, LWOBTextureLoader } from './LWOBParser'
import { ResourceCache } from './ResourceCache'
import { RaiderTool, RaiderTools } from '../game/model/raider/RaiderTool'
import { RaiderTraining, RaiderTrainings } from '../game/model/raider/RaiderTraining'
import { LWSCData, LWSCParser } from './LWSCParser'
import { AnimEntityData, AnimEntityParser } from './AnimEntityParser'

export class ResourceManager extends ResourceCache {
    static lwoCache: Map<string, SceneMesh> = new Map()
    static lwscCache: Map<string, LWSCData> = new Map()
    static aeCache: Map<string, AnimEntityData> = new Map()

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
        texture.colorSpace = SRGBColorSpace
        return texture
    }

    private static getImgDataFromSharedPaths(lTextureFilename: string, textureFilename: string, lMeshFilepath: string, lEntityFilepath: string): ImageData {
        const ugSharedFilename = `vehicles/sharedug/${lTextureFilename}`
        return this.resourceByName.getOrUpdate(ugSharedFilename, () => {
            const worldSharedFilename = `world/shared/${lTextureFilename}`
            return this.resourceByName.getOrUpdate(worldSharedFilename, () => {
                if (VERBOSE) console.warn(`Texture '${textureFilename}' (${lMeshFilepath}, ${lEntityFilepath}, ${worldSharedFilename}) unknown!`)
                return null
            })
        })
    }

    static getTexture(textureFilepath: string): Texture | null { // TODO cache textures
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
                    const result = new LWOBParser(sharedLwoBuffer, textureLoader).parse()
                    result.name = sharedLwoFilepath
                    return result
                })
            }
            const textureLoader = new ResourceManagerTextureLoader(getPath(lwoFilepath), entityPath)
            const result = new LWOBParser(lwoBuffer, textureLoader).parse()
            result.name = lwoFilepath
            return result
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
        const animData = this.getAnimatedDataOrNull(aeName)
        if (!animData) throw new Error(`Could not get animation data for: ${aeName}`)
        return animData
    }

    static getAnimatedDataOrNull(aeName: string): AnimEntityData {
        return this.aeCache.getOrUpdate(aeName.toLowerCase(), () => {
            const aeFilename = `${aeName}/${aeName.split('/').last()}.ae`
            const cfgRoot = ResourceManager.getResource(aeFilename)
            return !!cfgRoot ? new AnimEntityParser(cfgRoot, `${aeName}/`).parse() : null
        })
    }

    static async getTooltipSprite(tooltipText: string): Promise<SpriteImage> {
        if (tooltipText.toLowerCase().startsWith('tooltip')) {
            console.error(`Found key instead of tooltip text ${tooltipText}`)
        }
        const tooltipTextImage = await this.bitmapFontWorkerPool.createTextImage(TOOLTIP_FONT_NAME, tooltipText)
        return this.wrapTooltipSprite([tooltipTextImage])
    }

    static async getRaiderTooltipSprite(tooltipText: string, numToolSlots: number, tools: RaiderTool[], trainings: RaiderTraining[]): Promise<SpriteImage> {
        const tooltipTextImage = await this.bitmapFontWorkerPool.createTextImage(TOOLTIP_FONT_NAME, tooltipText)
        const toolIcons = tools.map((t) => {
            return ResourceManager.getImage(ResourceManager.configuration.tooltipIcons.get(RaiderTools.toToolTipIconName(t)))
        })
        for (let c = toolIcons.length; c < numToolSlots; c++) {
            toolIcons.push(ResourceManager.getImage(ResourceManager.configuration.tooltipIcons.get('blank')))
        }
        const trainingIcons = trainings.map((t) => {
            return ResourceManager.getImage(ResourceManager.configuration.tooltipIcons.get(RaiderTrainings.toToolTipIconName(t)))
        })
        return this.wrapTooltipSprite([tooltipTextImage], toolIcons, trainingIcons)
    }

    static async getBuildingSiteTooltipSprite(tooltipText: string, crystals: { actual: number, needed: number }, ores: { actual: number, needed: number }, bricks: { actual: number, needed: number }): Promise<SpriteImage> {
        const tooltipTextImage = await this.bitmapFontWorkerPool.createTextImage(TOOLTIP_FONT_NAME, tooltipText)
        const crystalsTextImage = crystals?.needed ? [await this.bitmapFontWorkerPool.createTextImage(TOOLTIP_FONT_NAME, `${ResourceManager.configuration.objectNamesCfg.get('powercrystal')}: ${crystals.actual}/${crystals.needed}`)] : []
        const oresTextImage = ores?.needed ? [await this.bitmapFontWorkerPool.createTextImage(TOOLTIP_FONT_NAME, `${ResourceManager.configuration.objectNamesCfg.get('ore')}: ${ores.actual}/${ores.needed}`)] : []
        const bricksTextImage = bricks?.needed ? [await this.bitmapFontWorkerPool.createTextImage(TOOLTIP_FONT_NAME, `${ResourceManager.configuration.objectNamesCfg.get('processedore')}: ${bricks.actual}/${bricks.needed}`)] : []
        return this.wrapTooltipSprite([tooltipTextImage], crystalsTextImage, oresTextImage, bricksTextImage)
    }

    static async getBuildingMissingOreForUpgradeTooltipSprite(tooltipText: string, buildingMissingOreForUpgrade: number): Promise<SpriteImage> {
        const tooltipTextImage = await this.bitmapFontWorkerPool.createTextImage(TOOLTIP_FONT_NAME, ResourceManager.configuration.toolTipInfo.get('orerequiredtext') + ':')
        const oresTextImage = []
        const oreImg = ResourceManager.getImage(ResourceManager.configuration.tooltipIcons.get('ore'))
        for (let c = 0; c < buildingMissingOreForUpgrade; c++) {
            oresTextImage.push(oreImg)
        }
        return this.wrapTooltipSprite([tooltipTextImage], oresTextImage)
    }

    static wrapTooltipSprite(...rowsThenCols: SpriteImage[][]): SpriteImage {
        const margin = 2
        const padding = 2
        const [contentWidth, contentHeight] = ResourceManager.getTooltipContentSize(rowsThenCols)
        const context = createContext(contentWidth + 2 * margin + 2 * padding, contentHeight + 2 * margin + 2 * padding)
        context.fillStyle = '#004000'
        context.fillRect(0, 0, context.canvas.width, context.canvas.height)
        context.fillStyle = '#188418'
        context.fillRect(0, 0, context.canvas.width - margin, context.canvas.height - margin)
        context.fillStyle = '#006400' // TODO read ToolTipRGB from config
        context.fillRect(margin, margin, context.canvas.width - 2 * margin, context.canvas.height - 2 * margin)
        let posY = margin + padding
        for (const cols of rowsThenCols) {
            let posX = 0
            let maxHeight = 0
            for (const img of cols) {
                context.drawImage(img, margin + padding + posX, posY)
                posX += img.width
                maxHeight = Math.max(maxHeight, img.height)
            }
            posY += maxHeight
        }
        return context.canvas
    }

    private static getTooltipContentSize(rowsThenCols: SpriteImage[][]): number[] {
        let contentWidth = 0
        let contentHeight = 0
        for (const cols of rowsThenCols) {
            let rowWidth = 0
            let maxHeight = 0
            for (const img of cols) {
                rowWidth += img.width
                maxHeight = Math.max(maxHeight, img.height)
            }
            contentWidth = Math.max(contentWidth, rowWidth)
            contentHeight += maxHeight
        }
        return [contentWidth, contentHeight]
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
            if (!texture
                && textureFilename !== 'teofoilreflections.jpg' // known issue with original game files
            ) {
                console.warn(`Could not get mesh texture "${textureFilename}" from mesh path "${this.meshPath}" or entity path "${this.entityPath}"`)
            }
            return texture ? [texture] : []
        }
    }
}
