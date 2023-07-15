import { AbstractGameSystem, GameEntity } from '../ECS'
import { PositionComponent } from '../component/PositionComponent'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'

export class SceneEntityPositionSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([AnimatedSceneEntityComponent, PositionComponent])
    dirtyComponents: Set<Function> = new Set([PositionComponent])

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number) {
        for (const entity of dirty) {
            try {
                const components = this.ecs.getComponents(entity)
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
