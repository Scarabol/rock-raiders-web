import { GameComponent } from '../../model/GameComponent'
import { AbstractGameEntity } from '../../entity/AbstractGameEntity'
import { HealthBarSprite } from '../../../scene/HealthBarSprite'
import { HealthComponent } from './HealthComponent'
import { Object3D } from 'three'
import { HealthBarSpriteSystem } from '../../system/HealthBarSpriteSystem'
import { AnimatedSceneEntityComponent } from './AnimatedSceneEntityComponent'

export class HealthBarSpriteComponent implements GameComponent {
    sprite: HealthBarSprite = null
    hideAfterChangeTimeout: number = 0
    actualStatus: number = 1
    targetStatus: number = 1

    constructor(readonly yOffset: number, readonly scale: number, readonly parent: Object3D, readonly canBeShownPermanently: boolean) {
    }

    setupComponent(entity: AbstractGameEntity) {
        this.sprite = new HealthBarSprite(this.yOffset, this.scale)
        this.sprite.visible = !entity.worldMgr.healthBarSpriteSystem.showOnlyOnChange && this.canBeShownPermanently
        if (this.parent) {
            this.parent.add(this.sprite) // XXX add to animated scene entity after raider is made of components
        } else {
            entity.getComponent(AnimatedSceneEntityComponent).addChild(this.sprite)
        }
        entity.getComponent(HealthComponent).addOnChangeListener((health) => {
            this.targetStatus = health
            entity.worldMgr.healthBarSpriteSystem.markDirtyStatus(this)
        })
    }

    disposeComponent() {
        this.sprite.material.dispose()
    }

    updateStatus(elapsedMs: number) {
        const diff = this.targetStatus - this.actualStatus
        const sgn = Math.sign(diff)
        const amountStatus = Math.abs(diff)
        this.actualStatus += sgn * Math.min(Math.min(HealthBarSpriteSystem.STATUS_CHANGE_SPEED, amountStatus) * elapsedMs, amountStatus)
        this.sprite.setStatus(this.actualStatus)
    }
}
