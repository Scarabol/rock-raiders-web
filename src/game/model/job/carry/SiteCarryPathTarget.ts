import { Vector2 } from 'three'
import { ITEM_ACTION_RANGE_SQ } from '../../../../params'
import { BarrierActivity } from '../../activities/BarrierActivity'
import { BuildingSite } from '../../building/BuildingSite'
import { EntityType } from '../../EntityType'
import { MaterialEntity } from '../../material/MaterialEntity'
import { CarryPathTarget } from './CarryPathTarget'

export class SiteCarryPathTarget extends CarryPathTarget {
    constructor(readonly site: BuildingSite, location: Vector2, readonly headingOnSite: number = null) {
        super(location, ITEM_ACTION_RANGE_SQ)
    }

    gatherItem(item: MaterialEntity) {
        item.sceneEntity.addToScene(this.targetLocation, this.headingOnSite)
        if (item.entityType === EntityType.BARRIER) {
            item.sceneEntity.changeActivity(BarrierActivity.Expand, () => item.sceneEntity.changeActivity(BarrierActivity.Long))
        }
        this.site.addItem(item)
    }
}
