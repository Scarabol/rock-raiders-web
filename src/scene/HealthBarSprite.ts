import { CanvasTexture, Sprite, SpriteMaterial } from 'three'
import { createContext } from '../core/ImageHelper'
import { SpriteContext } from '../core/Sprite'

export class HealthBarSprite extends Sprite {
    private static readonly textureSize = 128
    private readonly textureContext: SpriteContext
    private readonly activeArea: { x: number, y: number, w: number, h: number } = {x: 0, y: 0, w: 0, h: 0}

    constructor(yOffset: number, scale: number) {
        super(new SpriteMaterial({depthTest: false}))
        this.position.set(0, yOffset, 0)
        this.scale.set(scale, scale, 1)
        this.textureContext = createContext(HealthBarSprite.textureSize, HealthBarSprite.textureSize)
        this.textureContext.fillStyle = '#6e7374'
        const height = Math.round(HealthBarSprite.textureSize / 4.5)
        const posY = Math.round((HealthBarSprite.textureSize - height) / 2)
        this.textureContext.fillRect(0, posY, HealthBarSprite.textureSize, height)
        this.textureContext.fillStyle = '#085808'
        this.activeArea.x = Math.round(height / 6)
        this.activeArea.y = posY + this.activeArea.x
        this.textureContext.fillRect(this.activeArea.x, this.activeArea.y, HealthBarSprite.textureSize, height - this.activeArea.x)
        this.textureContext.fillStyle = '#0f0'
        this.activeArea.w = HealthBarSprite.textureSize - 2 * this.activeArea.x
        this.activeArea.h = height - 2 * this.activeArea.x
        this.textureContext.fillRect(this.activeArea.x, this.activeArea.y, this.activeArea.w, this.activeArea.h)
        this.material.map = new CanvasTexture(this.textureContext.canvas as HTMLCanvasElement)
    }

    setStatus(value: number) {
        const x = Math.max(0, Math.min(1, value))
        this.textureContext.fillStyle = '#0f0'
        this.textureContext.fillRect(this.activeArea.x, this.activeArea.y, this.activeArea.w, this.activeArea.h)
        this.textureContext.fillStyle = '#f00'
        const redPosX = Math.round(this.activeArea.w * x)
        this.textureContext.fillRect(this.activeArea.x + redPosX, this.activeArea.y, this.activeArea.w - redPosX, this.activeArea.h)
        this.material.map.needsUpdate = true
    }
}
