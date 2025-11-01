import { AbstractGameSystem, ECS, FilteredEntities } from '../ECS'
import { HealthComponent } from '../component/HealthComponent'
import { LastWillComponent } from '../component/LastWillComponent'
import { SelectionFrameComponent } from '../component/SelectionFrameComponent'
import { SelectionChanged } from '../../event/LocalEvents'
import { WorldManager } from '../WorldManager'
import { EventBroker } from '../../event/EventBroker'

export class DeathSystem extends AbstractGameSystem {
    readonly withLastWill: FilteredEntities = this.addEntityFilter(HealthComponent, LastWillComponent)

    constructor(readonly worldMgr: WorldManager) {
        super()
    }

    update(ecs: ECS, _elapsedMs: number): void {
        for (const [entity, components] of this.withLastWill) {
            try {
                const healthComponent = components.get(HealthComponent)
                if (healthComponent.health <= 0) {
                    const selectionFrameComponent = components.getOptional(SelectionFrameComponent)
                    ecs.removeComponent(entity, SelectionFrameComponent)
                    components.get(LastWillComponent).onDeath()
                    ecs.removeComponent(entity, LastWillComponent)
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
