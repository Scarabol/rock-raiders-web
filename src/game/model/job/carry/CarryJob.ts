import { RaiderActivity } from '../../activities/RaiderActivity'
import { MaterialEntity } from '../../material/MaterialEntity'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { ShareableJob } from '../ShareableJob'
import { CarryPathTarget } from './CarryPathTarget'
import { SiteCarryPathTarget } from './SiteCarryPathTarget'

export class CarryJob<I extends MaterialEntity> extends ShareableJob {
    item: I
    targets: CarryPathTarget[] = []
    actualTarget: CarryPathTarget = null

    constructor(item: I) {
        super()
        this.item = item
    }

    getWorkplaces(): CarryPathTarget[] {
        if (this.targets.length < 1 || this.actualTarget?.isInvalid()) {
            this.targets = this.item.findCarryTargets()
        }
        return this.targets
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return this.item.getPriorityIdentifier()
    }

    setActualWorkplace(target: CarryPathTarget) {
        if (this.actualTarget === target) return
        (this.actualTarget as SiteCarryPathTarget)?.site?.unAssign(this.item)
        this.actualTarget = target;
        (this.actualTarget as SiteCarryPathTarget)?.site?.assign(this.item)
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
            f.dropCarried()
            this.item.sceneEntity.position.copy(this.item.sceneMgr.getFloorPosition(this.actualTarget.targetLocation))
        })
        this.actualTarget.gatherItem(this.item)
    }
}
