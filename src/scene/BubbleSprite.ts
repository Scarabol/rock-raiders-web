import { Sprite, SpriteMaterial } from 'three'
import { ResourceManager } from '../resource/ResourceManager'

export class BubbleSprite extends Sprite {
    constructor(bubbleTextureName: string) {
        super(BubbleSprite.createBubbleSpriteMaterial(bubbleTextureName))
        this.scale.setScalar(8)
        this.position.set(0, 25, 0)
    }

    private static createBubbleSpriteMaterial(bubbleTextureName: string) {
        const texture = ResourceManager.getTexture(bubbleTextureName)
        return new SpriteMaterial({map: texture, depthTest: false})
    }
}
