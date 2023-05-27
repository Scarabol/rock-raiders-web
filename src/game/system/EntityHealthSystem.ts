import { AbstractGameSystem, GameEntity } from '../ECS'
import { HealthComponent } from '../component/HealthComponent'
import { SceneEntityComponent } from '../component/SceneEntityComponent'

export class EntityHealthSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set<Function>([HealthComponent])
    dirtyComponents: Set<Function> = new Set<Function>([HealthComponent])

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number): void {
        for (const entity of dirty) {
            try {
                const components = this.ecs.getComponents(entity)
                const healthComponent = components.get(HealthComponent)
                if (healthComponent.isDead()) {
                    // FIXME if has beam up component, beam it up scotty!
                    const sceneEntityComponent = components.get(SceneEntityComponent)
                    sceneEntityComponent.sceneEntity.disposeFromScene()
                    this.ecs.removeEntity(entity)
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
}
