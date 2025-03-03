import { AbstractGameSystem, GameEntity } from '../ECS'
import { FallInComponent } from '../component/FallInComponent'
import { PRNG } from '../factory/PRNG'

export class FallInSystem extends AbstractGameSystem {
    readonly componentsRequired: Set<Function> = new Set([FallInComponent])

    update(elapsedMs: number, entities: Set<GameEntity>, dirty: Set<GameEntity>): void {
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
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
