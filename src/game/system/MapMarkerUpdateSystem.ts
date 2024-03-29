import { AbstractGameSystem, GameEntity } from '../ECS'
import { PositionComponent } from '../component/PositionComponent'
import { MapMarkerChange, MapMarkerComponent } from '../component/MapMarkerComponent'
import { UpdateRadarEntityEvent } from '../../event/LocalEvents'
import { EventBroker } from '../../event/EventBroker'

export class MapMarkerUpdateSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([PositionComponent, MapMarkerComponent])
    dirtyComponents: Set<Function> = new Set([PositionComponent])

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number): void {
        for (const entity of dirty) {
            try {
                const components = this.ecs.getComponents(entity)
                const mapMarkerType = components.get(MapMarkerComponent).mapMarkerType
                const position = components.get(PositionComponent).position
                EventBroker.publish(new UpdateRadarEntityEvent(mapMarkerType, entity, MapMarkerChange.UPDATE, position))
            } catch (e) {
                console.error(e)
            }
        }
    }
}
