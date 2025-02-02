import { Sprite, SpriteMaterial } from 'three'
import { Updatable } from '../game/model/Updateable'
import { ResourceManager } from '../resource/ResourceManager'
import { GameState } from '../game/model/GameState'

export class BubbleSprite extends Sprite implements Updatable {
    enabled: boolean = false
    blinkDelay: number = 0

    constructor(bubbleTextureName: string) {
        super(BubbleSprite.createBubbleSpriteMaterial(bubbleTextureName))
        this.scale.setScalar(8)
        this.position.set(0, 25, 0)
    }

    private static createBubbleSpriteMaterial(bubbleTextureName: string) {
        const texture = ResourceManager.getTexture(bubbleTextureName)
        return new SpriteMaterial({map: texture, depthTest: false})
    }

    update(elapsedMs: number) {
        this.blinkDelay = (this.blinkDelay + elapsedMs) % 1000
        this.visible = this.enabled && this.blinkDelay < 500 && GameState.isBirdView
    }

    setEnabled(enabled: boolean) {
        if (this.enabled === enabled) return
        this.enabled = enabled
        this.blinkDelay = 0
    }
}
