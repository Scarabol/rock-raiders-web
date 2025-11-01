import { AbstractGameSystem, ECS, GameEntity } from '../ECS'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { HeadingComponent } from '../component/HeadingComponent'

export class SceneEntityHeadingSystem extends AbstractGameSystem {
    readonly componentsRequired: Set<Function> = new Set([AnimatedSceneEntityComponent, HeadingComponent])
    override readonly dirtyComponents: Set<Function> = new Set([HeadingComponent])

    update(ecs: ECS, _elapsedMs: number, _entities: Set<GameEntity>, dirty: Set<GameEntity>): void {
        for (const entity of dirty) {
            try {
                const components = ecs.getComponents(entity)
                const sceneEntityComponent = components.get(AnimatedSceneEntityComponent)
                const headingComponent = components.get(HeadingComponent)
                sceneEntityComponent.sceneEntity.headTowards(headingComponent.location)
            } catch (e) {
                console.error(e)
            }
        }
    }
}
