import { CanvasTexture, Sprite, SpriteMaterial } from 'three'
import { createContext } from '../core/ImageHelper'

export class SelectionFrameSprite extends Sprite {
    private static readonly textureSize = 128
    private static readonly baseStrength = 50
    private static readonly shankLength = SelectionFrameSprite.textureSize / 6

    constructor(pickSphereDiameter: number, hexColor: string) {
        super(SelectionFrameSprite.createSpriteMaterial(pickSphereDiameter, hexColor))
    }

    private static createSpriteMaterial(pickSphereDiameter: number, hexColor: string) {
        const ctx = createContext(SelectionFrameSprite.textureSize, SelectionFrameSprite.textureSize)
        ctx.fillStyle = hexColor
        const strength = Math.round(SelectionFrameSprite.baseStrength / pickSphereDiameter)
        ctx.fillRect(0, 0, SelectionFrameSprite.shankLength, strength)
        ctx.fillRect(0, 0, strength, SelectionFrameSprite.shankLength)
        ctx.fillRect(SelectionFrameSprite.textureSize - SelectionFrameSprite.shankLength, 0, SelectionFrameSprite.shankLength, strength)
        ctx.fillRect(SelectionFrameSprite.textureSize - strength, 0, strength, SelectionFrameSprite.shankLength)
        ctx.fillRect(SelectionFrameSprite.textureSize - strength, SelectionFrameSprite.textureSize - SelectionFrameSprite.shankLength, strength, SelectionFrameSprite.shankLength)
        ctx.fillRect(SelectionFrameSprite.textureSize - SelectionFrameSprite.shankLength, SelectionFrameSprite.textureSize - strength, SelectionFrameSprite.shankLength, strength)
        ctx.fillRect(0, SelectionFrameSprite.textureSize - strength, SelectionFrameSprite.shankLength, strength)
        ctx.fillRect(0, SelectionFrameSprite.textureSize - SelectionFrameSprite.shankLength, strength, SelectionFrameSprite.shankLength)
        const selectionFrameTexture = new CanvasTexture(ctx.canvas)
        return new SpriteMaterial({map: selectionFrameTexture, depthTest: false})
    }
}
