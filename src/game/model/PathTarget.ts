import { Vector2 } from 'three'
import { RaiderActivity } from './activities/RaiderActivity'
import { BuildingEntity } from './building/BuildingEntity'
import { CarryJob } from './job/carry/CarryJob'
import { Surface } from './map/Surface'
import { MaterialEntity } from './material/MaterialEntity'

export class PathTarget {
    constructor(
        readonly targetLocation: Vector2,
        readonly building: BuildingEntity = null,
        readonly surface: Surface = null,
        readonly radiusSq: number = 0) {
    }

    static fromLocation(targetLocation: Vector2, radiusSq: number = 0) {
        return new PathTarget(targetLocation, null, null, radiusSq)
    }

    static fromBuilding(targetLocation: Vector2, building: BuildingEntity) {
        return new PathTarget(targetLocation, building, null, 0)
    }

    static fromSurface(targetLocation: Vector2, surface: Surface) {
        return new PathTarget(targetLocation, null, surface, 0)
    }

    getFocusPoint(): Vector2 {
        if (this.building) return this.building.primarySurface.getCenterWorld2D()
        return this.targetLocation
    }

    isInvalid(): boolean {
        return (this.building && !this.building.isPowered()) || (this.surface && !this.surface.isWalkable())
    }

    reserveGatherSlot(job: CarryJob): boolean {
        return true
    }

    gatherItem(item: MaterialEntity) {
        item.sceneEntity.addToScene(null, null)
    }

    getDropAction(): RaiderActivity {
        return RaiderActivity.Place
    }
}
