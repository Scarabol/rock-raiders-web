import { AbstractGameComponent } from '../ECS'
import { Object3D, Sprite, SpriteMaterial } from 'three'
import { ResourceManager } from '../../resource/ResourceManager'
import { GameState } from '../model/GameState'
import { BubblesCfg } from '../../cfg/BubblesCfg'
import { Updatable } from '../model/Updateable'

export class RaiderInfoComponent extends AbstractGameComponent {
    readonly bubbleSprite: BubbleSprite
    readonly hungerSprite: Sprite

    constructor(parent: Object3D) {
        super()
        this.bubbleSprite = new BubbleSprite()
        this.setBubbleTexture('bubbleIdle')
        parent.add(this.bubbleSprite)
        this.hungerSprite = new Sprite(new SpriteMaterial({depthTest: false}))
        this.setHungerIndicator(1)
        this.hungerSprite.center.set(0, 0.75)
        this.hungerSprite.position.y = 16 - ResourceManager.configuration.objInfo.hungerImagesPosition[1] / 4
        this.hungerSprite.scale.setScalar(4)
        parent.add(this.hungerSprite)
        this.hungerSprite.visible = GameState.showObjInfo
    }

    setBubbleTexture(textureName: keyof BubblesCfg) {
        if (!textureName) return
        const textureFilepath = ResourceManager.configuration.bubbles[textureName] as string
        this.bubbleSprite.material.map = textureFilepath ? ResourceManager.getTexture(textureFilepath) : null
        if (textureName !== 'bubbleIdle') this.bubbleSprite.showDelayMs = 1000
    }

    setHungerIndicator(hungerLevel: number) {
        this.hungerSprite.material.map = ResourceManager.getTexture(this.getHungerTextureName(hungerLevel))
    }

    private getHungerTextureName(hungerLevel: number) {
        if (hungerLevel >= 0.8) return ResourceManager.configuration.objInfo.hungerImages.hungerImage4
        else if (hungerLevel >= 0.6) return ResourceManager.configuration.objInfo.hungerImages.hungerImage3
        else if (hungerLevel >= 0.4) return ResourceManager.configuration.objInfo.hungerImages.hungerImage2
        else if (hungerLevel >= 0.2) return ResourceManager.configuration.objInfo.hungerImages.hungerImage1
        else return ResourceManager.configuration.objInfo.hungerImages.hungerImage0
    }
}

class BubbleSprite extends Sprite implements Updatable {
    showDelayMs: number = 0

    constructor() {
        super(new SpriteMaterial({depthTest: false}))
        this.center.set(1, 0.5)
        this.position.y = 19 - ResourceManager.configuration.objInfo.bubbleImagesPosition[1] / 9
        this.scale.set(9, 9, 0)
        this.updateVisibleState()
    }

    update(elapsedMs: number) {
        if (this.showDelayMs > 0) {
            this.showDelayMs -= elapsedMs
        }
        this.updateVisibleState()
    }

    updateVisibleState() {
        this.visible = GameState.showObjInfo || this.showDelayMs > 0
    }
}
