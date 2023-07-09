import { AbstractGameSystem, GameEntity } from '../ECS'
import { HealthComponent } from '../component/HealthComponent'
import { LastWillComponent } from '../component/LastWillComponent'
import { SelectionFrameComponent } from '../component/SelectionFrameComponent'
import { EventBus } from '../../event/EventBus'
import { SelectionChanged } from '../../event/LocalEvents'
import { WorldManager } from '../WorldManager'

export class DeathSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([HealthComponent, LastWillComponent])
    dirtyComponents = new Set([HealthComponent])

    constructor(readonly worldMgr: WorldManager) {
        super()
    }

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number): void {
        for (const entity of dirty) {
            try {
                const components = this.ecs.getComponents(entity)
                const healthComponent = components.get(HealthComponent)
                if (healthComponent.health <= 0) {
                    const selectionFrameComponent = components.get(SelectionFrameComponent)
                    this.ecs.removeComponent(entity, SelectionFrameComponent)
                    components.get(LastWillComponent).onDeath()
                    this.ecs.removeComponent(entity, LastWillComponent)
                    if (selectionFrameComponent?.isSelected()) {
                        selectionFrameComponent.deselect()
                        EventBus.publishEvent(new SelectionChanged(this.worldMgr.entityMgr))
                    }
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
}
