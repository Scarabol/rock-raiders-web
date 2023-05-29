import { AbstractGameComponent } from '../ECS'
import { HealthBarSprite } from '../../scene/HealthBarSprite'
import { Object3D } from 'three'

export class HealthBarComponent extends AbstractGameComponent {
    sprite: HealthBarSprite = null
    hideAfterChangeTimeout: number = 0
    actualStatus: number = 1
    targetStatus: number = 1

    // TODO Replace with info element, see ObjInfo in cfg

    constructor(readonly yOffset: number, readonly scale: number, readonly parent: Object3D, readonly canBeShownPermanently: boolean) {
        super()
        this.sprite = new HealthBarSprite(this.yOffset, this.scale)
        // this.sprite.visible = !entity.worldMgr.healthBarSpriteSystem.showOnlyOnChange && this.canBeShownPermanently
        // if (this.parent) {
        //     this.parent.add(this.sprite) // XXX add to animated scene entity after raider is made of components
        // } else {
        //     entity.getComponent(AnimatedSceneEntityComponent).addChild(this.sprite)
        // }
        // entity.getComponent(HealthComponent).addOnChangeListener((health) => {
        //     this.targetStatus = health
        //     entity.worldMgr.healthBarSpriteSystem.markDirtyStatus(this)
        // })
    }
}
