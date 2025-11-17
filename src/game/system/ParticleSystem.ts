import { AbstractGameSystem, GameEntity } from '../ECS'
import { PositionComponent } from '../component/PositionComponent'
import { ParticleEmitterComponent } from '../component/ParticleEmitterComponent'

export class ParticleSystem extends AbstractGameSystem {
    readonly componentsRequired: Set<Function> = new Set([ParticleEmitterComponent])

    update(elapsedMs: number, entities: Set<GameEntity>, dirty: Set<GameEntity>): void {
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const positionComponent = components.get(PositionComponent)
                if (positionComponent && !positionComponent.isDiscovered) continue
                const emitterComponent = components.get(ParticleEmitterComponent)
                emitterComponent.update(elapsedMs, positionComponent)
            } catch (e) {
                console.error(e)
            }
        }
    }
}
