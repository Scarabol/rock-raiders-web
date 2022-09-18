import { Vector2 } from 'three'
import { PathTarget } from '../PathTarget'
import { BuildingEntity } from './BuildingEntity'

export class BuildingPathTarget extends PathTarget {
    building: BuildingEntity

    constructor(location: Vector2, building: BuildingEntity) {
        super(location)
        this.building = building
    }

    getFocusPoint(): Vector2 {
        return this.building.primarySurface.getCenterWorld2D()
    }
}
