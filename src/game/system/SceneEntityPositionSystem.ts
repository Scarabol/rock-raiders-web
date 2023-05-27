import { AbstractGameSystem, GameEntity } from '../ECS'
import { PositionComponent } from '../component/PositionComponent'
import { SceneEntityComponent } from '../component/SceneEntityComponent'

export class SceneEntityPositionSystem extends AbstractGameSystem { // TODO replace system with events?
    componentsRequired: Set<Function> = new Set([SceneEntityComponent, PositionComponent])
    dirtyComponents: Set<Function> = new Set([PositionComponent])

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number) {
        for (const entity of dirty) {
            try {
                const components = this.ecs.getComponents(entity)
                const sceneEntityComponent = components.get(SceneEntityComponent)
                const positionComponent = components.get(PositionComponent)
                sceneEntityComponent.sceneEntity.position = positionComponent.position
            } catch (e) {
                console.error(e)
            }
        }
    }
}
