import { EventBus } from '../../event/EventBus'
import { UpdateRadarEntities } from '../../event/LocalEvents'
import { EntityMapMarkerComponent } from '../component/common/EntityMapMarkerComponent'
import { AbstractSubSystem } from './AbstractSubSystem'

export class MapMarkerSubSystem extends AbstractSubSystem<EntityMapMarkerComponent> {

    // TODO enable/disable system, when map is shown/hidden

    constructor() {
        super(EntityMapMarkerComponent)
    }

    update(elapsedMs: number) {
        const event = new UpdateRadarEntities()
        // TODO Only send moved entities and adds/removals
        this.forEachComponent((c) => {
            event.entitiesByOrder.getOrUpdate(c.mapMarkerType, () => []).push(c.position2D())
        })
        EventBus.publishEvent(event)
    }
}
