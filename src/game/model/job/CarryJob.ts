import { SupervisedJob } from '../../Supervisor'
import { AnimationActivity } from '../anim/AnimationActivity'
import { MaterialEntity } from '../material/MaterialEntity'
import { PathTarget } from '../PathTarget'
import { RaiderTraining } from '../raider/RaiderTraining'
import { AbstractJob, JobFulfiller } from './Job'
import { PriorityIdentifier } from './PriorityIdentifier'
import { Raider } from '../raider/Raider'
import { VehicleEntity } from '../vehicle/VehicleEntity'

export class CarryJob extends AbstractJob implements SupervisedJob {
    fulfiller: JobFulfiller = null
    target: PathTarget

    constructor(readonly carryItem: MaterialEntity) {
        super()
    }

    getWorkplace(entity: Raider | VehicleEntity): PathTarget {
        if (!this.target || this.target?.isInvalid()) {
            this.target = this.carryItem.findCarryTargets()
                .map((b) => entity.findPathToTarget(b))
                .filter((t) => !!t)
                .sort((l, r) => l.lengthSq - r.lengthSq)[0].target
        }
        return this.target
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return this.carryItem.priorityIdentifier
    }

    getRequiredTraining(): RaiderTraining {
        return this.carryItem.requiredTraining
    }

    getWorkActivity(): AnimationActivity {
        return this.target?.getDropAction()
    }

    isReadyToComplete(): boolean {
        return !!(this.target?.canGatherItem())
    }

    onJobComplete() {
        super.onJobComplete()
        this.fulfiller.sceneEntity.headTowards(this.target.targetLocation)
        this.fulfiller.dropCarried()
        this.carryItem.sceneEntity.position.copy(this.carryItem.worldMgr.sceneMgr.getFloorPosition(this.target.targetLocation))
        this.target.gatherItem(this.carryItem)
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
}
