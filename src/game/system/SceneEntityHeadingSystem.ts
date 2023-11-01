import { AbstractGameSystem, GameEntity } from '../ECS'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { HeadingComponent } from '../component/HeadingComponent'

export class SceneEntityHeadingSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([AnimatedSceneEntityComponent, HeadingComponent])
    dirtyComponents: Set<Function> = new Set([HeadingComponent])

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number) {
        for (const entity of dirty) {
            try {
                const components = this.ecs.getComponents(entity)
                const sceneEntityComponent = components.get(AnimatedSceneEntityComponent)
                const worldTargetComponent = components.get(HeadingComponent)
                sceneEntityComponent.sceneEntity.headTowards(worldTargetComponent.location)
            } catch (e) {
                console.error(e)
            }
        }
    }
}
