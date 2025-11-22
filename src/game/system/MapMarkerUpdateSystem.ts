import { AbstractGameSystem, ECS, FilteredEntities } from '../ECS'
import { PositionComponent } from '../component/PositionComponent'
import { MAP_MARKER_CHANGE, MapMarkerComponent } from '../component/MapMarkerComponent'
import { UpdateRadarEntityEvent } from '../../event/LocalEvents'
import { EventBroker } from '../../event/EventBroker'
import { MAP_MAX_UPDATE_INTERVAL, TILESIZE } from '../../params'

export class MapMarkerUpdateSystem extends AbstractGameSystem {
    readonly trackedEntities: FilteredEntities = this.addEntityFilter(PositionComponent, MapMarkerComponent)

    update(_ecs: ECS, elapsedMs: number): void {
        // TODO Only update if position changed
        for (const [entity, components] of this.trackedEntities) {
            try {
                const mapMarkerComponent = components.get(MapMarkerComponent)
                const mapMarkerType = mapMarkerComponent.mapMarkerType
                mapMarkerComponent.lastUpdateMs += elapsedMs
                const position = components.get(PositionComponent).position
                if (mapMarkerComponent.lastUpdateMs > MAP_MAX_UPDATE_INTERVAL && position.distanceToSquared(mapMarkerComponent.lastPos) / TILESIZE * 15 > 2) {
                    EventBroker.publish(new UpdateRadarEntityEvent(mapMarkerType, entity, MAP_MARKER_CHANGE.update, position))
                    mapMarkerComponent.lastUpdateMs = 0
                    mapMarkerComponent.lastPos.copy(position)
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
}
