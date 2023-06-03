import { AbstractGameSystem, GameEntity } from '../ECS'
import { PositionComponent } from '../component/PositionComponent'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'

export class SceneEntityPositionSystem extends AbstractGameSystem { // TODO replace system with events?
    componentsRequired: Set<Function> = new Set([AnimatedSceneEntityComponent, PositionComponent])
    dirtyComponents: Set<Function> = new Set([PositionComponent])

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number) {
        for (const entity of dirty) {
            try {
                const components = this.ecs.getComponents(entity)
                const sceneEntityComponent = components.get(AnimatedSceneEntityComponent)
                const positionComponent = components.get(PositionComponent)
                sceneEntityComponent.move(positionComponent.position, positionComponent.floorOffset)
            } catch (e) {
                console.error(e)
            }
        }
    }
}
