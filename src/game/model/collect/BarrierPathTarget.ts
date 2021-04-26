import { Vector3 } from 'three'
import { BarrierActivity } from '../activities/activities/BarrierActivity'
import { CollectPathTarget } from '../CollectPathTarget'
import { BarrierLocation } from './BarrierLocation'
import { CollectableEntity } from './CollectableEntity'

export class BarrierPathTarget extends CollectPathTarget {

    heading: number

    constructor(location: BarrierLocation, site) {
        super(location.location, site, null)
        this.heading = location.heading
    }

    gatherItem(item: CollectableEntity) {
        item.targetSite.addItem(item)
        item.group.position.copy(new Vector3(this.targetLocation.x, item.worldMgr.getFloorHeight(this.targetLocation.x, this.targetLocation.y), this.targetLocation.y))
        item.group.rotation.y = this.heading
        item.changeActivity(BarrierActivity.Expand, () => {
            item.changeActivity(BarrierActivity.Long)
        })
    }

    canGatherItem(): boolean {
        return true
    }

}
