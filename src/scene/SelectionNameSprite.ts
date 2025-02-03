import { CanvasTexture, Sprite, SpriteMaterial } from 'three'
import { createContext } from '../core/ImageHelper'

export class SelectionNameSprite extends Sprite {
    private static readonly textureSize = 256

    setName(name: string) {
        this.material?.dispose()
        this.material = SelectionNameSprite.createSpriteMaterial(name)
    }

    private static createSpriteMaterial(label: string) {
        const ctx = createContext(this.textureSize, this.textureSize)
        const context = ctx
        context.textAlign = 'center'
        context.font = 'bold 20px sans-serif'
        context.fillStyle = '#fff'
        context.fillText(label, this.textureSize / 2, this.textureSize / 2)
        const spriteTexture = new CanvasTexture(ctx.canvas)
        return new SpriteMaterial({map: spriteTexture, depthTest: false})
    }
}
