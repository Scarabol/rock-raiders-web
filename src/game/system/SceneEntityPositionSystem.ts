import { AbstractGameSystem, ECS, FilteredEntities } from '../ECS'
import { PositionComponent } from '../component/PositionComponent'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'

export class SceneEntityPositionSystem extends AbstractGameSystem {
    readonly entitiesWithPosition: FilteredEntities = this.addEntityFilter(AnimatedSceneEntityComponent, PositionComponent)

    update(_ecs: ECS, _elapsedMs: number): void {
        // TODO Only update if position changed (dirty) and with certain timing
        for (const [_entity, components] of this.entitiesWithPosition) {
            try {
                const sceneEntityComponent = components.get(AnimatedSceneEntityComponent)
                const positionComponent = components.get(PositionComponent)
                sceneEntityComponent.sceneEntity.position.copy(positionComponent.position)
                sceneEntityComponent.sceneEntity.position.y += positionComponent.floorOffset
            } catch (e) {
                console.error(e)
            }
        }
    }
}
