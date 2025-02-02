import { CanvasTexture, Sprite, SpriteMaterial } from 'three'
import { createContext } from '../core/ImageHelper'
import { SpriteContext } from '../core/Sprite'
import { rgbToHtmlHex } from '../core/Util'
import { GameState } from '../game/model/GameState'
import { Updatable } from '../game/model/Updateable'
import { GameConfig } from '../cfg/GameConfig'

export class HealthBarSprite extends Sprite implements Updatable {
    static readonly textureSize = 128
    readonly textureContext: SpriteContext
    readonly activeArea: { x: number, y: number, w: number, h: number } = {x: 0, y: 0, w: 0, h: 0}
    actualStatus: number = 1
    targetStatus: number = 1
    visibleTimeout: number = 0

    constructor(yOffset: number, scale: number, readonly canBeShownPermanently: boolean) {
        super(new SpriteMaterial({depthTest: false}))
        this.position.set(0, yOffset, 0)
        this.scale.setScalar(scale)
        this.textureContext = createContext(HealthBarSprite.textureSize, HealthBarSprite.textureSize)
        const barWidth = GameConfig.instance.objInfo.healthBarWidthHeight[0]
        const barHeight = GameConfig.instance.objInfo.healthBarWidthHeight[1]
        const barBorderSize = GameConfig.instance.objInfo.healthBarBorderSize
        const sizeFactor = HealthBarSprite.textureSize / (barWidth + 2 * barBorderSize)
        const height = Math.round(sizeFactor * (barHeight + 2 * barBorderSize))
        const posY = Math.round((HealthBarSprite.textureSize - height) / 2)
        this.textureContext.fillStyle = rgbToHtmlHex(GameConfig.instance.objInfo.healthBarBorderRGB)
        this.textureContext.fillRect(0, posY, HealthBarSprite.textureSize, height)
        this.activeArea.x = Math.round(barBorderSize * sizeFactor)
        this.activeArea.y = posY + this.activeArea.x
        this.textureContext.fillStyle = rgbToHtmlHex(GameConfig.instance.objInfo.healthBarBorderRGB.map((v) => v / 2))
        this.textureContext.fillRect(this.activeArea.x, this.activeArea.y, HealthBarSprite.textureSize, height - this.activeArea.x)
        this.activeArea.w = HealthBarSprite.textureSize - 2 * this.activeArea.x
        this.activeArea.h = height - 2 * this.activeArea.x
        this.textureContext.fillStyle = rgbToHtmlHex(GameConfig.instance.objInfo.healthBarRGB)
        this.textureContext.fillRect(this.activeArea.x, this.activeArea.y, this.activeArea.w, this.activeArea.h)
        this.material.map = new CanvasTexture(this.textureContext.canvas)
        this.visible = false
    }

    setTargetStatus(targetStatus: number) {
        const nextStatus = Math.max(0, Math.min(1, targetStatus))
        if (this.targetStatus === nextStatus) return
        this.targetStatus = nextStatus
        this.visibleTimeout = 3000
        this.visible = GameState.isBirdView
    }

    update(elapsedMs: number) {
        if (this.visibleTimeout > 0) {
            this.visibleTimeout -= elapsedMs
        } else {
            this.visible = GameState.showObjInfo && this.canBeShownPermanently && GameState.isBirdView
            this.visibleTimeout = 0
        }
        if (this.targetStatus === this.actualStatus) return
        const delta = this.targetStatus - this.actualStatus
        this.actualStatus += Math.sign(delta) * Math.min(Math.abs(delta), 0.03)
        const x = Math.max(0, Math.min(1, this.actualStatus))
        this.textureContext.fillStyle = rgbToHtmlHex(GameConfig.instance.objInfo.healthBarRGB)
        this.textureContext.fillRect(this.activeArea.x, this.activeArea.y, this.activeArea.w, this.activeArea.h)
        this.textureContext.fillStyle = rgbToHtmlHex(GameConfig.instance.objInfo.healthBarBackgroundRGB)
        const redPosX = Math.round(this.activeArea.w * x)
        this.textureContext.fillRect(this.activeArea.x + redPosX, this.activeArea.y, this.activeArea.w - redPosX, this.activeArea.h)
        if (this.material.map) this.material.map.needsUpdate = true
    }
}
