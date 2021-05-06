import { Vector3 } from 'three'
import { RaiderActivity } from '../activities/RaiderActivity'
import { CarryPathTarget, SiteCarryPathTarget } from '../collect/CarryPathTarget'
import { MaterialEntity } from '../collect/MaterialEntity'
import { PublicJob } from './Job'
import { JobType } from './JobType'
import { PriorityIdentifier } from './PriorityIdentifier'

export class CarryJob<I extends MaterialEntity> extends PublicJob {

    item: I
    actualTarget: CarryPathTarget = null

    constructor(item: I) {
        super(JobType.CARRY)
        this.item = item
    }

    getWorkplaces(): CarryPathTarget[] {
        return this.item.getCarryTargets()
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return this.item.getPriorityIdentifier()
    }

    setActualWorkplace(target: CarryPathTarget) {
        this.item.setTargetSite((target as SiteCarryPathTarget)?.site)
        this.actualTarget = target
    }

    getCarryItem(): I {
        return this.item
    }

    getWorkActivity(): RaiderActivity {
        return this.actualTarget.getDropAction()
    }

    isReadyToComplete(): boolean {
        return this.actualTarget.canGatherItem()
    }

    onJobComplete() {
        super.onJobComplete()
        const targetLocation = this.actualTarget.targetLocation
        this.fulfiller.forEach((f) => {
            f.group.lookAt(new Vector3(targetLocation.x, f.group.position.y, targetLocation.y))
            f.dropItem()
        })
        this.actualTarget.gatherItem(this.item)
    }

}
