import { AbstractGameSystem, GameEntity } from '../ECS'
import { SceneEntityComponent } from '../component/SceneEntityComponent'
import { WorldTargetComponent } from '../component/WorldTargetComponent'

export class SceneEntityHeadingSystem extends AbstractGameSystem { // TODO replace system with events?
    componentsRequired: Set<Function> = new Set([SceneEntityComponent, WorldTargetComponent])
    dirtyComponents: Set<Function> = new Set([WorldTargetComponent])

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number) {
        for (const entity of dirty) {
            try {
                const components = this.ecs.getComponents(entity)
                const sceneEntityComponent = components.get(SceneEntityComponent)
                const worldTargetComponent = components.get(WorldTargetComponent)
                sceneEntityComponent.headTowards(worldTargetComponent.position)
            } catch (e) {
                console.error(e)
            }
        }
    }
}
