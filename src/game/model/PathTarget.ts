import { Vector2 } from 'three'
import { ITEM_ACTION_RANGE_SQ } from '../../params'
import { BuildingEntity } from './building/BuildingEntity'
import { BuildingSite } from './building/BuildingSite'

export class PathTarget {
    constructor(
        readonly targetLocation: Vector2,
        readonly radiusSq: number = 1,
        readonly building: BuildingEntity = null,
        readonly site: BuildingSite = null,
    ) {
    }

    static fromLocation(targetLocation: Vector2, radiusSq: number = 1) {
        return new PathTarget(targetLocation, radiusSq, null, null)
    }

    static fromBuilding(building: BuildingEntity, targetLocation: Vector2, radiusSq: number = 1) {
        return new PathTarget(targetLocation, radiusSq, building, null)
    }

    static fromSite(site: BuildingSite, targetLocation: Vector2) {
        return new PathTarget(targetLocation, ITEM_ACTION_RANGE_SQ, null, site)
    }

    getFocusPoint(): Vector2 {
        if (this.building) return this.building.primarySurface.getCenterWorld2D()
        return this.targetLocation
    }
}
