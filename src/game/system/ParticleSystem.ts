import { AbstractGameSystem, ECS, FilteredEntities } from '../ECS'
import { PositionComponent } from '../component/PositionComponent'
import { ParticleEmitterComponent } from '../component/ParticleEmitterComponent'

export class ParticleSystem extends AbstractGameSystem {
    readonly emitters: FilteredEntities = this.addEntityFilter(ParticleEmitterComponent)

    update(_ecs: ECS, elapsedMs: number): void {
        for (const [_entity, components] of this.emitters) {
            try {
                const positionComponent = components.getOptional(PositionComponent)
                if (positionComponent && !positionComponent.isDiscovered) return
                const emitterComponent = components.get(ParticleEmitterComponent)
                emitterComponent.update(elapsedMs, positionComponent)
            } catch (e) {
                console.error(e)
            }
        }
    }
}
