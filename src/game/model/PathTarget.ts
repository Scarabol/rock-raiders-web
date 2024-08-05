import { Vector2 } from 'three'
import { ITEM_ACTION_RANGE_SQ } from '../../params'
import { BuildingEntity } from './building/BuildingEntity'
import { BuildingSite } from './building/BuildingSite'
import { GameEntity } from '../ECS'

export class PathTarget {
    constructor(
        readonly targetLocation: Vector2,
        readonly radiusSq: number,
        readonly building: BuildingEntity | undefined,
        readonly site: BuildingSite | undefined,
        readonly entity: GameEntity | undefined,
        readonly focusPoint: Vector2 | undefined
    ) {
    }

    static fromLocation(targetLocation: Vector2, radiusSq: number = 1, focusPoint?: Vector2) {
        return new PathTarget(targetLocation, radiusSq, undefined, undefined, undefined, focusPoint)
    }

    static fromBuilding(building: BuildingEntity, targetLocation: Vector2, radiusSq: number, focusPoint: Vector2) {
        return new PathTarget(targetLocation, radiusSq, building, undefined, building.entity, focusPoint)
    }

    static fromSite(site: BuildingSite, targetLocation: Vector2) {
        return new PathTarget(targetLocation, ITEM_ACTION_RANGE_SQ, undefined, site, undefined, undefined)
    }

    static fromEntity(entity: GameEntity, targetLocation: Vector2, radiusSq: number) {
        return new PathTarget(targetLocation, radiusSq, undefined, undefined, entity, undefined)
    }
}
