import { SupervisedJob } from '../../../Supervisor'
import { RaiderActivity } from '../../activities/RaiderActivity'
import { MaterialEntity } from '../../material/MaterialEntity'
import { PathTarget } from '../../PathTarget'
import { RaiderTraining } from '../../raider/RaiderTraining'
import { AbstractJob, CancelableJob, JobFulfiller } from '../Job'
import { JobState } from '../JobState'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { SiteCarryPathTarget } from './SiteCarryPathTarget'

export class CarryJob extends AbstractJob implements SupervisedJob, CancelableJob {
    fulfiller: JobFulfiller = null
    targets: PathTarget[] = []
    actualTarget: PathTarget = null

    constructor(readonly item: MaterialEntity) {
        super()
    }

    getWorkplaces(): PathTarget[] {
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

    setActualWorkplace(target: PathTarget) {
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
        this.fulfiller.sceneEntity.headTowards(this.actualTarget.targetLocation)
        this.fulfiller.dropCarried()
        this.item.sceneEntity.position.copy(this.item.worldMgr.sceneMgr.getFloorPosition(this.actualTarget.targetLocation))
        this.actualTarget.gatherItem(this.item)
        this.item.onCarryJobComplete()
    }

    assign(fulfiller: JobFulfiller) {
        if (this.fulfiller !== fulfiller) this.fulfiller?.stopJob()
        this.fulfiller = fulfiller
    }

    unAssign(fulfiller: JobFulfiller) {
        if (this.fulfiller !== fulfiller) return
        this.fulfiller = fulfiller
    }

    hasFulfiller(): boolean {
        return !!this.fulfiller
    }

    cancel() {
        this.jobState = JobState.CANCELED
        this.fulfiller?.stopJob()
        this.fulfiller = null
    }
}
