import { SupervisedJob } from '../../Supervisor'
import { AnimationActivity } from '../anim/AnimationActivity'
import { MaterialEntity } from '../material/MaterialEntity'
import { PathTarget } from '../PathTarget'
import { RaiderTraining } from '../raider/RaiderTraining'
import { AbstractJob, CancelableJob, JobFulfiller } from './Job'
import { JobState } from './JobState'
import { PriorityIdentifier } from './PriorityIdentifier'

export class CarryJob extends AbstractJob implements SupervisedJob, CancelableJob {
    fulfiller: JobFulfiller = null
    targets: PathTarget[] = []
    actualTarget: PathTarget = null

    constructor(readonly carryItem: MaterialEntity) {
        super()
    }

    getWorkplaces(): PathTarget[] {
        if (this.targets.length < 1 || this.actualTarget?.isInvalid()) {
            this.targets = this.carryItem.findCarryTargets()
        }
        return this.targets
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return this.carryItem.priorityIdentifier
    }

    getRequiredTraining(): RaiderTraining {
        return this.carryItem.requiredTraining
    }

    setActualWorkplace(target: PathTarget) {
        if (this.actualTarget === target) return
        this.actualTarget?.site?.unAssign(this.carryItem)
        this.actualTarget = target
        this.actualTarget?.site?.assign(this.carryItem)
    }

    getWorkActivity(): AnimationActivity {
        return this.actualTarget.getDropAction()
    }

    isReadyToComplete(): boolean {
        return this.actualTarget.reserveGatherSlot(this)
    }

    onJobComplete() {
        super.onJobComplete()
        this.fulfiller.sceneEntity.headTowards(this.actualTarget.targetLocation)
        this.fulfiller.dropCarried()
        this.carryItem.sceneEntity.position.copy(this.carryItem.worldMgr.sceneMgr.getFloorPosition(this.actualTarget.targetLocation))
        this.actualTarget.gatherItem(this.carryItem)
        this.carryItem.onCarryJobComplete()
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
