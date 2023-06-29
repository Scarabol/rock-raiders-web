import { CanvasTexture, Sprite, SpriteMaterial } from 'three'
import { createContext } from '../core/ImageHelper'
import { SpriteContext } from '../core/Sprite'
import { ResourceManager } from '../resource/ResourceManager'
import { rgbToHtmlHex } from '../core/Util'

export class HealthBarSprite extends Sprite {
    private static readonly textureSize = 128
    private readonly textureContext: SpriteContext
    private readonly activeArea: { x: number, y: number, w: number, h: number } = {x: 0, y: 0, w: 0, h: 0}

    constructor(yOffset: number, scale: number) {
        super(new SpriteMaterial({depthTest: false}))
        this.position.set(0, yOffset, 0)
        this.scale.setScalar(scale)
        this.textureContext = createContext(HealthBarSprite.textureSize, HealthBarSprite.textureSize)
        const barWidth = ResourceManager.configuration.objInfo.healthBarWidthHeight[0]
        const barHeight = ResourceManager.configuration.objInfo.healthBarWidthHeight[1]
        const barBorderSize = ResourceManager.configuration.objInfo.healthBarBorderSize
        const sizeFactor = HealthBarSprite.textureSize / (barWidth + 2 * barBorderSize)
        const height = Math.round(sizeFactor * (barHeight + 2 * barBorderSize))
        const posY = Math.round((HealthBarSprite.textureSize - height) / 2)
        this.textureContext.fillStyle = rgbToHtmlHex(ResourceManager.configuration.objInfo.healthBarBorderRGB)
        this.textureContext.fillRect(0, posY, HealthBarSprite.textureSize, height)
        this.activeArea.x = Math.round(barBorderSize * sizeFactor)
        this.activeArea.y = posY + this.activeArea.x
        this.textureContext.fillStyle = rgbToHtmlHex(ResourceManager.configuration.objInfo.healthBarBorderRGB.map((v) => v / 2))
        this.textureContext.fillRect(this.activeArea.x, this.activeArea.y, HealthBarSprite.textureSize, height - this.activeArea.x)
        this.activeArea.w = HealthBarSprite.textureSize - 2 * this.activeArea.x
        this.activeArea.h = height - 2 * this.activeArea.x
        this.textureContext.fillStyle = rgbToHtmlHex(ResourceManager.configuration.objInfo.healthBarRGB)
        this.textureContext.fillRect(this.activeArea.x, this.activeArea.y, this.activeArea.w, this.activeArea.h)
        this.material.map = new CanvasTexture(this.textureContext.canvas as HTMLCanvasElement)
    }

    setStatus(value: number) {
        const x = Math.max(0, Math.min(1, value))
        this.textureContext.fillStyle = rgbToHtmlHex(ResourceManager.configuration.objInfo.healthBarRGB)
        this.textureContext.fillRect(this.activeArea.x, this.activeArea.y, this.activeArea.w, this.activeArea.h)
        this.textureContext.fillStyle = rgbToHtmlHex(ResourceManager.configuration.objInfo.healthBarBackgroundRGB)
        const redPosX = Math.round(this.activeArea.w * x)
        this.textureContext.fillRect(this.activeArea.x + redPosX, this.activeArea.y, this.activeArea.w - redPosX, this.activeArea.h)
        this.material.map.needsUpdate = true
    }
}
