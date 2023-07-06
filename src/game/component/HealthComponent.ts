import { AbstractGameComponent } from '../ECS'
import { HealthBarSprite } from '../../scene/HealthBarSprite'
import { Object3D } from 'three'
import { GameState } from '../model/GameState'
import { EventBus } from '../../event/EventBus'
import { ToggleAlarmEvent } from '../../event/WorldEvents'

export class HealthComponent extends AbstractGameComponent {
    health: number = 100
    maxHealth: number = 100
    sprite: HealthBarSprite = null
    actualStatus: number = 1
    targetStatus: number = 1
    visibleTimeout: number = 0

    constructor(readonly triggerAlarm: boolean, yOffset: number, scale: number, parent: Object3D, readonly canBeShownPermanently: boolean) {
        super()
        this.sprite = new HealthBarSprite(yOffset, scale)
        this.setVisible(GameState.showObjInfo)
        parent.add(this.sprite)
    }

    setVisible(visible: boolean) {
        this.sprite.visible = visible && this.canBeShownPermanently
    }

    changeHealth(delta: number) {
        this.health = Math.max(0, Math.min(this.maxHealth, this.health + delta))
        if (delta < 0 && this.triggerAlarm) EventBus.publishEvent(new ToggleAlarmEvent(true))
    }

    updateSpriteStatus(targetStatus: number, elapsedMs: number) {
        if (this.visibleTimeout > 0) {
            this.visibleTimeout -= elapsedMs
        } else {
            this.sprite.visible = false
            this.visibleTimeout = 0
        }
        const nextStatus = Math.max(0, Math.min(1, targetStatus))
        if (this.targetStatus !== nextStatus) {
            this.targetStatus = nextStatus
            this.visibleTimeout = 3000
            this.sprite.visible = true
        }
        if (this.targetStatus === this.actualStatus) return
        const delta = this.targetStatus - this.actualStatus
        this.actualStatus += Math.sign(delta) * Math.min(Math.abs(delta), 0.03)
        this.sprite.setStatus(this.actualStatus)
    }
}
