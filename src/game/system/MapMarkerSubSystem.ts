import { AbstractSubSystem } from './AbstractSubSystem'
import { EntityMapMarkerComponent } from '../component/common/EntityMapMarkerComponent'
import { UpdateRadarEntities } from '../../event/LocalEvents'
import { EventBus } from '../../event/EventBus'

export class MapMarkerSubSystem extends AbstractSubSystem<EntityMapMarkerComponent> {

    // TODO enable/disable system, when map is shown/hidden

    constructor() {
        super(EntityMapMarkerComponent)
    }

    update(elapsedMs: number) {
        const event = new UpdateRadarEntities()
        // TODO Only send moved entities and adds/removals
        this.components.forEach((c) => {
            event.entitiesByOrder.getOrUpdate(c.mapMarkerType, () => []).push(c.position2d())
        })
        EventBus.publishEvent(event)
    }
}
