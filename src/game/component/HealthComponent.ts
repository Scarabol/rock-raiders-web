import { AbstractGameComponent } from '../ECS'
import { HealthBarSprite } from '../../scene/HealthBarSprite'
import { Object3D } from 'three'
import { EventBus } from '../../event/EventBus'
import { ToggleAlarmEvent } from '../../event/WorldEvents'

export class HealthComponent extends AbstractGameComponent {
    health: number = 100
    maxHealth: number = 100
    sprite: HealthBarSprite = null

    constructor(
        readonly triggerAlarm: boolean,
        yOffset: number,
        scale: number,
        parent: Object3D,
        canBeShownPermanently: boolean,
        public rockFallDamage: number,
    ) {
        super()
        this.sprite = new HealthBarSprite(yOffset, scale, canBeShownPermanently)
        parent.add(this.sprite)
    }

    changeHealth(delta: number) {
        const nextHealth = Math.max(0, Math.min(this.maxHealth, this.health + delta))
        if (this.health === nextHealth) return
        this.health = nextHealth
        if (delta < 0) {
            console.warn(`Damage (${delta}) visualization not yet implemented`) // TODO replace with flying number of interface/fonts/healthfont visualizing the damage
            if (this.triggerAlarm) EventBus.publishEvent(new ToggleAlarmEvent(true))
        }
        this.sprite.setTargetStatus(this.health / this.maxHealth)
        this.markDirty()
    }
}
