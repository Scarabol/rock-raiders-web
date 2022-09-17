import { RaiderActivity } from '../../activities/RaiderActivity'
import { MaterialEntity } from '../../material/MaterialEntity'
import { RaiderTraining } from '../../raider/RaiderTraining'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { ShareableJob } from '../ShareableJob'
import { CarryPathTarget } from './CarryPathTarget'
import { SiteCarryPathTarget } from './SiteCarryPathTarget'

export class CarryJob extends ShareableJob {
    targets: CarryPathTarget[] = []
    actualTarget: CarryPathTarget = null

    constructor(readonly item: MaterialEntity) {
        super()
    }

    getWorkplaces(): CarryPathTarget[] {
        if (this.targets.length < 1 || this.actualTarget?.isInvalid()) {
            this.targets = this.item.findCarryTargets()
        }
        return this.targets
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return this.item.priorityIdentifier
    }

    getRequiredTraining(): RaiderTraining {
        return this.item.requiredTraining
    }

    setActualWorkplace(target: CarryPathTarget) {
        if (this.actualTarget === target) return
        (this.actualTarget as SiteCarryPathTarget)?.site?.unAssign(this.item)
        this.actualTarget = target;
        (this.actualTarget as SiteCarryPathTarget)?.site?.assign(this.item)
    }

    getCarryItem(): MaterialEntity {
        return this.item
    }

    getWorkActivity(): RaiderActivity {
        return this.actualTarget.getDropAction()
    }

    isReadyToComplete(): boolean {
        return this.actualTarget.reserveGatherSlot(this)
    }

    onJobComplete() {
        super.onJobComplete()
        this.fulfiller.forEach((f) => {
            f.sceneEntity.headTowards(this.actualTarget.targetLocation)
            f.dropCarried()
            this.item.sceneEntity.position.copy(this.item.worldMgr.sceneMgr.getFloorPosition(this.actualTarget.targetLocation))
        })
        this.actualTarget.gatherItem(this.item)
        this.item.onCarryJobComplete()
    }
}
