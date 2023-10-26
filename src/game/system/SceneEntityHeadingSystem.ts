import { AbstractGameSystem, GameEntity } from '../ECS'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { WorldTargetComponent } from '../component/WorldTargetComponent'

export class SceneEntityHeadingSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([AnimatedSceneEntityComponent, WorldTargetComponent])
    dirtyComponents: Set<Function> = new Set([WorldTargetComponent])

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number) {
        for (const entity of dirty) {
            try {
                const components = this.ecs.getComponents(entity)
                const sceneEntityComponent = components.get(AnimatedSceneEntityComponent)
                const worldTargetComponent = components.get(WorldTargetComponent)
                if (worldTargetComponent.faceTarget) sceneEntityComponent.sceneEntity.headTowards(worldTargetComponent.position)
            } catch (e) {
                console.error(e)
            }
        }
    }
}
