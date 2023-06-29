import { AbstractGameComponent } from '../ECS'
import { Object3D, Sprite, SpriteMaterial } from 'three'
import { ResourceManager } from '../../resource/ResourceManager'
import { GameState } from '../model/GameState'
import { BubblesCfg } from '../../cfg/BubblesCfg'

export class RaiderInfoComponent extends AbstractGameComponent {
    readonly bubbleSprite: Sprite
    readonly hungerSprite: Sprite
    showDelayMs: number = 0

    constructor(parent: Object3D) {
        super()
        this.bubbleSprite = new Sprite(new SpriteMaterial({depthTest: false}))
        this.setBubbleTexture('bubbleIdle')
        this.bubbleSprite.center.set(1, 0.5)
        this.bubbleSprite.position.y = 19 - ResourceManager.configuration.objInfo.bubbleImagesPosition[1] / 9
        this.bubbleSprite.scale.set(9, 9, 0)
        parent.add(this.bubbleSprite)
        this.hungerSprite = new Sprite(new SpriteMaterial({depthTest: false}))
        this.setHungerLevel(1)
        this.hungerSprite.center.set(0, 0.75)
        this.hungerSprite.position.y = 16 - ResourceManager.configuration.objInfo.hungerImagesPosition[1] / 4
        this.hungerSprite.scale.setScalar(4)
        parent.add(this.hungerSprite)
        this.bubbleSprite.visible = GameState.showObjInfo
        this.hungerSprite.visible = GameState.showObjInfo
    }

    setBubbleTexture(textureName: keyof BubblesCfg) {
        if (!textureName) return
        const textureFilepath = ResourceManager.configuration.bubbles[textureName] as string
        this.bubbleSprite.material.map = textureFilepath ? ResourceManager.getTexture(textureFilepath) : null
        if (textureName !== 'bubbleIdle') this.showDelayMs = 1000
    }

    setHungerLevel(hungerLevel: number) {
        this.hungerSprite.material.map = ResourceManager.getTexture(this.getHungerTextureName(hungerLevel))
    }

    private getHungerTextureName(hungerLevel: number) {
        if (hungerLevel >= 1) return ResourceManager.configuration.objInfo.hungerImages.hungerImage4
        else if (hungerLevel >= 0.75) return ResourceManager.configuration.objInfo.hungerImages.hungerImage3
        else if (hungerLevel >= 0.5) return ResourceManager.configuration.objInfo.hungerImages.hungerImage2
        else if (hungerLevel >= 0.25) return ResourceManager.configuration.objInfo.hungerImages.hungerImage1
        else return ResourceManager.configuration.objInfo.hungerImages.hungerImage0
    }
}
