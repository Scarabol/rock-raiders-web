import { AbstractGameSystem, GameEntity } from '../ECS'
import { HealthComponent } from '../component/HealthComponent'
import { EventKey } from '../../event/EventKeyEnum'
import { DynamiteExplosionEvent } from '../../event/WorldEvents'
import { PositionComponent } from '../component/PositionComponent'
import { SurfaceType } from '../terrain/SurfaceType'
import { MovableStatsComponent } from '../component/MovableStatsComponent'
import { LandslideEvent } from '../../event/WorldLocationEvent'
import { GameConfig } from '../../cfg/GameConfig'
import { EventBroker } from '../../event/EventBroker'

export class DamageSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set<Function>([PositionComponent, HealthComponent])
    readonly landslides: PositionComponent[] = []
    readonly dynamiteExplosions: DynamiteExplosionEvent[] = []
    readonly dynamiteRadiusSq: number = 0
    readonly dynamiteMaxDamage: number = 0

    constructor() {
        super()
        this.dynamiteRadiusSq = Math.pow(GameConfig.instance.main.DynamiteDamageRadius, 2)
        this.dynamiteMaxDamage = GameConfig.instance.main.DynamiteMaxDamage
        EventBroker.subscribe(EventKey.DYNAMITE_EXPLOSION, (event: DynamiteExplosionEvent) => {
            this.dynamiteExplosions.push(event)
        })
        EventBroker.subscribe(EventKey.LOCATION_LANDSLIDE, (event: LandslideEvent) => {
            this.landslides.push(event.location)
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
                        healthComponent.changeHealth(-this.dynamiteMaxDamage * Math.pow(inRangeSq, 2))
                    }
                })
                const movableComponent = components.get(MovableStatsComponent)
                if (!movableComponent?.crossLava && positionComponent.surface.surfaceType === SurfaceType.LAVA5) {
                    healthComponent.changeHealth(-50 / 1000 * elapsedMs)
                }
                this.landslides.forEach((landslide) => {
                    if (positionComponent.surface !== landslide.surface) return
                    healthComponent.changeHealth(-healthComponent.rockFallDamage * 50) // TODO balance fallins
                })
            } catch (e) {
                console.error(e)
            }
        }
        this.dynamiteExplosions.length = 0
        this.landslides.length = 0
    }
}
