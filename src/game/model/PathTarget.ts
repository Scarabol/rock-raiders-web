import { Vector2 } from 'three'
import { BuildingEntity } from './building/BuildingEntity'

export class PathTarget {
    constructor(readonly targetLocation: Vector2, readonly building: BuildingEntity = null, readonly radiusSq: number = 0) {
    }

    getFocusPoint(): Vector2 {
        if (this.building) return this.building.primarySurface.getCenterWorld2D()
        return this.targetLocation
    }

    isInvalid(): boolean {
        return false
    }
}
