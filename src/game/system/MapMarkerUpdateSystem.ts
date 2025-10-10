import { AbstractGameSystem, GameEntity } from '../ECS'
import { PositionComponent } from '../component/PositionComponent'
import { MAP_MARKER_CHANGE, MapMarkerComponent } from '../component/MapMarkerComponent'
import { UpdateRadarEntityEvent } from '../../event/LocalEvents'
import { EventBroker } from '../../event/EventBroker'

export class MapMarkerUpdateSystem extends AbstractGameSystem {
    readonly componentsRequired: Set<Function> = new Set([PositionComponent, MapMarkerComponent])
    readonly dirtyComponents: Set<Function> = new Set([PositionComponent])

    update(elapsedMs: number, entities: Set<GameEntity>, dirty: Set<GameEntity>): void {
        for (const entity of dirty) {
            try {
                const components = this.ecs.getComponents(entity)
                const mapMarkerType = components.get(MapMarkerComponent).mapMarkerType
                const position = components.get(PositionComponent).position
                EventBroker.publish(new UpdateRadarEntityEvent(mapMarkerType, entity, MAP_MARKER_CHANGE.update, position))
            } catch (e) {
                console.error(e)
            }
        }
    }
}
