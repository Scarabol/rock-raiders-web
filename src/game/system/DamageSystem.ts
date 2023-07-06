import { AbstractGameSystem, GameEntity } from '../ECS'
import { HealthComponent } from '../component/HealthComponent'
import { EventBus } from '../../event/EventBus'
import { EventKey } from '../../event/EventKeyEnum'
import { DynamiteExplosionEvent, ToggleAlarmEvent } from '../../event/WorldEvents'
import { PositionComponent } from '../component/PositionComponent'
import { ResourceManager } from '../../resource/ResourceManager'
import { HealthBarComponent } from '../component/HealthBarComponent'
import { SurfaceType } from '../terrain/SurfaceType'

export class DamageSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set<Function>([PositionComponent, HealthComponent, HealthBarComponent])
    readonly dynamiteExplosions: DynamiteExplosionEvent[] = []
    readonly dynamiteRadiusSq: number = 0
    readonly dynamiteMaxDamage: number = 0

    constructor() {
        super()
        this.dynamiteRadiusSq = Math.pow(ResourceManager.configuration.main.DynamiteDamageRadius, 2)
        this.dynamiteMaxDamage = ResourceManager.configuration.main.DynamiteMaxDamage
        EventBus.registerEventListener(EventKey.DYNAMITE_EXPLOSION, (event: DynamiteExplosionEvent) => {
            this.dynamiteExplosions.push(event)
        })
    }

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number): void {
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const positionComponent = components.get(PositionComponent)
                const healthComponent = components.get(HealthComponent)
                const position = positionComponent.getPosition2D()
                this.dynamiteExplosions.forEach((explosion) => {
                    const distanceSq = position.distanceToSquared(explosion.position)
                    const inRangeSq = 1 - distanceSq / this.dynamiteRadiusSq
                    if (inRangeSq > 0) {
                        healthComponent.health -= this.dynamiteMaxDamage * Math.pow(inRangeSq, 2)
                        if (healthComponent.triggerAlarm) EventBus.publishEvent(new ToggleAlarmEvent(true))
                    }
                })
                if (positionComponent.surface.surfaceType === SurfaceType.LAVA5 && healthComponent.health > 0) {
                    healthComponent.health -= 50 / 1000 * elapsedMs
                    if (healthComponent.triggerAlarm) EventBus.publishEvent(new ToggleAlarmEvent(true))
                }
                components.get(HealthBarComponent).updateStatus(healthComponent.health / healthComponent.maxHealth, elapsedMs)
            } catch (e) {
                console.error(e)
            }
        }
        this.dynamiteExplosions.length = 0
    }
}
