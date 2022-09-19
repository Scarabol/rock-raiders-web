import { Vector2 } from 'three'
import { ITEM_ACTION_RANGE_SQ } from '../../params'
import { BarrierActivity } from './activities/BarrierActivity'
import { RaiderActivity } from './activities/RaiderActivity'
import { BuildingEntity } from './building/BuildingEntity'
import { BuildingSite } from './building/BuildingSite'
import { EntityType } from './EntityType'
import { CarryJob } from './job/carry/CarryJob'
import { Surface } from './map/Surface'
import { MaterialEntity } from './material/MaterialEntity'

export class PathTarget {
    constructor(
        readonly targetLocation: Vector2,
        readonly building: BuildingEntity = null,
        readonly surface: Surface = null,
        readonly site: BuildingSite = null,
        readonly radiusSq: number = 0,
        readonly headingOnSite: number = null) {
    }

    static fromLocation(targetLocation: Vector2, radiusSq: number = 0) {
        return new PathTarget(targetLocation, null, null, null, radiusSq)
    }

    static fromBuilding(building: BuildingEntity, targetLocation: Vector2) {
        return new PathTarget(targetLocation, building, null, null, 0)
    }

    static fromSurface(surface: Surface, targetLocation: Vector2) {
        return new PathTarget(targetLocation, null, surface, null, 0)
    }

    static fromSite(site: BuildingSite, targetLocation: Vector2, headingOnSite: number = 0) {
        return new PathTarget(targetLocation, null, null, site, ITEM_ACTION_RANGE_SQ, headingOnSite)
    }

    getFocusPoint(): Vector2 {
        if (this.building) return this.building.primarySurface.getCenterWorld2D()
        return this.targetLocation
    }

    isInvalid(): boolean {
        return (this.building && !this.building.isPowered()) || (this.surface && !this.surface.isWalkable()) || (this.site && (this.site.complete || this.site.canceled))
    }

    reserveGatherSlot(job: CarryJob): boolean {
        return true
    }

    gatherItem(item: MaterialEntity) {
        item.sceneEntity.addToScene(null, this.headingOnSite)
        if (item.entityType === EntityType.BARRIER) {
            item.sceneEntity.changeActivity(BarrierActivity.Expand, () => item.sceneEntity.changeActivity(BarrierActivity.Long))
        }
        this.site?.addItem(item)
    }

    getDropAction(): RaiderActivity {
        return RaiderActivity.Place
    }
}
