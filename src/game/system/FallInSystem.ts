import { AbstractGameSystem, ECS, FilteredEntities } from '../ECS'
import { FallInComponent } from '../component/FallInComponent'
import { PRNG } from '../factory/PRNG'

export class FallInSystem extends AbstractGameSystem {
    readonly activeFallIns: FilteredEntities = this.addEntityFilter(FallInComponent)

    update(_ecs: ECS, elapsedMs: number): void {
        for (const [_entity, components] of this.activeFallIns) {
            try {
                const fallInComponent = components.get(FallInComponent)
                if (!fallInComponent.target.discovered || !fallInComponent.target.surfaceType.floor) continue
                if (fallInComponent.timer > 0) {
                    fallInComponent.timer -= elapsedMs
                    continue
                }
                fallInComponent.timer = fallInComponent.maxTimerMs
                const origin = PRNG.terrain.sample(fallInComponent.target.neighbors.filter((n) => n.isReinforcable()))
                if (origin) origin.terrain.createFallIn(origin, fallInComponent.target)
            } catch (e) {
                console.error(e)
            }
        }
    }
}
