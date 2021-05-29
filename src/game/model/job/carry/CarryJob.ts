import { RaiderActivity } from '../../activities/RaiderActivity'
import { CarryPathTarget, SiteCarryPathTarget } from '../../material/CarryPathTarget'
import { MaterialEntity } from '../../material/MaterialEntity'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { ShareableJob } from '../ShareableJob'

export class CarryJob<I extends MaterialEntity> extends ShareableJob {

    item: I
    actualTarget: CarryPathTarget = null

    constructor(item: I) {
        super()
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
        this.fulfiller.forEach((f) => {
            f.sceneEntity.headTowards(this.actualTarget.targetLocation)
            f.dropItem()
            this.item.sceneEntity.position.copy(this.item.sceneMgr.getFloorPosition(this.actualTarget.targetLocation))
        })
        this.actualTarget.gatherItem(this.item)
    }

}
