import { AbstractGameSystem, ECS, FilteredEntities } from '../ECS'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { HeadingComponent } from '../component/HeadingComponent'

export class SceneEntityHeadingSystem extends AbstractGameSystem {
    readonly entitiesWithHeading: FilteredEntities = this.addEntityFilter(AnimatedSceneEntityComponent, HeadingComponent)

    update(_ecs: ECS, _elapsedMs: number): void {
        // TODO Only update changed components
        for (const [_entity, components] of this.entitiesWithHeading) {
            try {
                const sceneEntityComponent = components.get(AnimatedSceneEntityComponent)
                const headingComponent = components.get(HeadingComponent)
                sceneEntityComponent.sceneEntity.headTowards(headingComponent.location)
            } catch (e) {
                console.error(e)
            }
        }
    }
}
