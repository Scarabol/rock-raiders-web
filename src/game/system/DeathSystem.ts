import { AbstractGameSystem, GameEntity } from '../ECS'
import { HealthComponent } from '../component/HealthComponent'
import { LastWillComponent } from '../component/LastWillComponent'
import { SelectionFrameComponent } from '../component/SelectionFrameComponent'
import { SelectionChanged } from '../../event/LocalEvents'
import { WorldManager } from '../WorldManager'
import { EventBroker } from '../../event/EventBroker'

export class DeathSystem extends AbstractGameSystem {
    readonly componentsRequired: Set<Function> = new Set([HealthComponent, LastWillComponent])
    readonly dirtyComponents: Set<Function> = new Set([HealthComponent])

    constructor(readonly worldMgr: WorldManager) {
        super()
    }

    update(elapsedMs: number, entities: Set<GameEntity>, dirty: Set<GameEntity>): void {
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
                        if (this.worldMgr.entityMgr.selection.building?.entity === entity) {
                            this.worldMgr.entityMgr.selection.building = undefined
                        }
                        this.worldMgr.entityMgr.selection.raiders.removeAll((v) => v.entity === entity)
                        this.worldMgr.entityMgr.selection.vehicles.removeAll((v) => v.entity === entity)
                        if (this.worldMgr.entityMgr.selection.fence?.entity === entity) {
                            this.worldMgr.entityMgr.selection.fence = undefined
                        }
                        selectionFrameComponent.deselect()
                        EventBroker.publish(new SelectionChanged(this.worldMgr.entityMgr))
                    }
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
}
