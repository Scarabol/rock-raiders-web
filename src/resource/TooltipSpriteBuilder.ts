import { SpriteImage } from '../core/Sprite'
import { BitmapFontWorkerPool } from '../worker/BitmapFontWorkerPool'
import { TOOLTIP_FONT_NAME } from '../params'
import { RaiderTool, RaiderTools } from '../game/model/raider/RaiderTool'
import { RaiderTraining, RaiderTrainings } from '../game/model/raider/RaiderTraining'
import { createContext } from '../core/ImageHelper'
import { ResourceManager } from './ResourceManager'
import { GameConfig } from '../cfg/GameConfig'

export class TooltipSpriteBuilder {
    static async getTooltipSprite(tooltipText: string, energy: number): Promise<SpriteImage> {
        if (tooltipText.toLowerCase().startsWith('tooltip')) {
            console.error(`Found key instead of tooltip text ${tooltipText}`)
        }
        const requests: Promise<SpriteImage>[] = [BitmapFontWorkerPool.instance.createTextImage(TOOLTIP_FONT_NAME, tooltipText)]
        if (energy) {
            requests.add(BitmapFontWorkerPool.instance.createTextImage(TOOLTIP_FONT_NAME, `${GameConfig.instance.toolTipInfo['energytext']}: ${Math.round(energy)}`))
        }
        const tooltipTextImages = await Promise.all(requests)
        return this.wrapTooltipSprite(...tooltipTextImages.map((s) => [s]))
    }

    static async getRaiderTooltipSprite(tooltipText: string, numToolSlots: number, tools: RaiderTool[], trainings: RaiderTraining[]): Promise<SpriteImage> {
        const tooltipTextImage = await BitmapFontWorkerPool.instance.createTextImage(TOOLTIP_FONT_NAME, tooltipText)
        const toolIcons = tools.map((t) => {
            return ResourceManager.getImage(GameConfig.instance.tooltipIcons[RaiderTools.toToolTipIconName(t)])
        })
        for (let c = toolIcons.length; c < numToolSlots; c++) {
            toolIcons.push(ResourceManager.getImage(GameConfig.instance.tooltipIcons['blank']))
        }
        const trainingIcons = trainings.map((t) => {
            return ResourceManager.getImage(GameConfig.instance.tooltipIcons[RaiderTrainings.toToolTipIconName(t)])
        })
        return this.wrapTooltipSprite([tooltipTextImage], toolIcons, trainingIcons)
    }

    static async getBuildingSiteTooltipSprite(tooltipText: string, crystals: { actual: number, needed: number }, ores: { actual: number, needed: number }, bricks: { actual: number, needed: number }): Promise<SpriteImage> {
        const tooltipTextImage = await BitmapFontWorkerPool.instance.createTextImage(TOOLTIP_FONT_NAME, tooltipText)
        const crystalsTextImage = crystals?.needed ? [await BitmapFontWorkerPool.instance.createTextImage(TOOLTIP_FONT_NAME, `${GameConfig.instance.objectNames['powercrystal']}: ${crystals.actual}/${crystals.needed}`)] : []
        const oresTextImage = ores?.needed ? [await BitmapFontWorkerPool.instance.createTextImage(TOOLTIP_FONT_NAME, `${GameConfig.instance.objectNames['ore']}: ${ores.actual}/${ores.needed}`)] : []
        const bricksTextImage = bricks?.needed ? [await BitmapFontWorkerPool.instance.createTextImage(TOOLTIP_FONT_NAME, `${GameConfig.instance.objectNames['processedore']}: ${bricks.actual}/${bricks.needed}`)] : []
        return this.wrapTooltipSprite([tooltipTextImage], crystalsTextImage, oresTextImage, bricksTextImage)
    }

    static async getBuildingMissingOreForUpgradeTooltipSprite(tooltipText: string, buildingMissingOreForUpgrade: number): Promise<SpriteImage> {
        const tooltipTextImage = await BitmapFontWorkerPool.instance.createTextImage(TOOLTIP_FONT_NAME, `${GameConfig.instance.toolTipInfo['orerequiredtext']}:`)
        const oresTextImage = []
        const oreImg = ResourceManager.getImage(GameConfig.instance.tooltipIcons['ore'])
        for (let c = 0; c < buildingMissingOreForUpgrade; c++) {
            oresTextImage.push(oreImg)
        }
        return this.wrapTooltipSprite([tooltipTextImage], oresTextImage)
    }

    static wrapTooltipSprite(...rowsThenCols: SpriteImage[][]): SpriteImage {
        const margin = 2
        const padding = 2
        const [contentWidth, contentHeight] = this.getTooltipContentSize(rowsThenCols)
        const context = createContext(contentWidth + 2 * margin + 2 * padding, contentHeight + 2 * margin + 2 * padding)
        context.fillStyle = '#004000' // 000:064:000 // XXX derive from ToolTipRGB from config
        context.fillRect(0, 0, context.canvas.width, context.canvas.height)
        context.fillStyle = '#188418' // 024:132:024 // XXX derive from ToolTipRGB from config
        context.fillRect(0, 0, context.canvas.width - margin, context.canvas.height - margin)
        context.fillStyle = '#006400' // XXX read ToolTipRGB from config
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
