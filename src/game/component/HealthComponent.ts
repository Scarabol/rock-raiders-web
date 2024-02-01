import { AbstractGameComponent } from '../ECS'
import { HealthBarSprite } from '../../scene/HealthBarSprite'
import { Object3D } from 'three'
import { ToggleAlarmEvent } from '../../event/WorldEvents'
import { HealthFontSprite } from '../../scene/HealthFontSprite'
import { EventBroker } from '../../event/EventBroker'

export class HealthComponent extends AbstractGameComponent {
    readonly healthBarSprite: HealthBarSprite = null
    readonly healthFontSprite: HealthFontSprite = null
    health: number = 100
    maxHealth: number = 100

    constructor(
        readonly triggerAlarm: boolean,
        yOffset: number,
        scale: number,
        parent: Object3D,
        canBeShownPermanently: boolean,
        public rockFallDamage: number,
    ) {
        super()
        this.healthBarSprite = new HealthBarSprite(yOffset, scale, canBeShownPermanently)
        parent.add(this.healthBarSprite)
        this.healthFontSprite = new HealthFontSprite(yOffset, scale)
        parent.add(this.healthFontSprite)
    }

    changeHealth(delta: number) {
        const nextHealth = Math.max(0, Math.min(this.maxHealth, this.health + delta))
        if (this.health === nextHealth) return
        this.health = nextHealth
        if (delta < 0) {
            this.healthFontSprite.setNumber(delta)
            if (this.triggerAlarm) EventBroker.publish(new ToggleAlarmEvent(true))
        }
        this.healthBarSprite.setTargetStatus(this.health / this.maxHealth)
        this.markDirty()
    }
}
