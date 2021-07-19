import { Sprite, SpriteMaterial } from 'three'
import { ResourceManager } from '../resource/ResourceManager'

export class BubbleSprite extends Sprite {

    constructor(bubbleName: string) {
        super(BubbleSprite.createBubbleSpriteMaterial(bubbleName))
        this.scale.setScalar(8)
        this.position.set(0, 25, 0)
    }

    private static createBubbleSpriteMaterial(bubbleName: string) {
        const texture = ResourceManager.getTexture(ResourceManager.cfg('Bubbles', bubbleName))
        return new SpriteMaterial({map: texture, depthTest: false})
    }

}
