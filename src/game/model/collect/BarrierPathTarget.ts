import { BarrierActivity } from '../activities/BarrierActivity'
import { BarrierLocation } from './BarrierLocation'
import { CarryPathTarget } from './CarryPathTarget'
import { MaterialEntity } from './MaterialEntity'

export class BarrierPathTarget extends CarryPathTarget {

    heading: number

    constructor(location: BarrierLocation, site) {
        super(location.location, site, null)
        this.heading = location.heading
    }

    gatherItem(item: MaterialEntity) {
        item.targetSite.addItem(item)
        item.group.position.copy(item.worldMgr.getFloorPosition(this.targetLocation))
        item.group.rotation.y = this.heading
        item.changeActivity(BarrierActivity.Expand, () => {
            item.changeActivity(BarrierActivity.Long)
        })
    }

    canGatherItem(): boolean {
        return true
    }

}
