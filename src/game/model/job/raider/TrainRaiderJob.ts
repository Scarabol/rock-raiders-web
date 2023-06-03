import { EventBus } from '../../../../event/EventBus'
import { RaiderTrainingCompleteEvent } from '../../../../event/LocalEvents'
import { EntityManager } from '../../../EntityManager'
import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { BuildingEntity } from '../../building/BuildingEntity'
import { PathTarget } from '../../PathTarget'
import { RaiderTraining } from '../../raider/RaiderTraining'
import { RaiderJob } from './RaiderJob'
import { Raider } from '../../raider/Raider'
import { VehicleEntity } from '../../vehicle/VehicleEntity'

export class TrainRaiderJob extends RaiderJob {
    workplaces: PathTarget[]

    constructor(readonly entityMgr: EntityManager, readonly training: RaiderTraining, readonly building: BuildingEntity) {
        super()
        this.workplaces = this.building?.getTrainingTargets()
    }

    getWorkplace(entity: Raider | VehicleEntity): PathTarget {
        if (!this.building?.isPowered()) this.workplaces = this.entityMgr.getTrainingSiteTargets(this.training)
        return this.workplaces
            .map((b) => entity.findPathToTarget(b))
            .filter((t) => !!t)
            .sort((l, r) => l.lengthSq - r.lengthSq)[0].target
    }

    onJobComplete() {
        super.onJobComplete()
        this.raider.addTraining(this.training)
        EventBus.publishEvent(new RaiderTrainingCompleteEvent(this.training))
    }

    getWorkActivity(): AnimationActivity {
        return RaiderActivity.Train
    }

    getExpectedTimeLeft(): number {
        return 10000 // XXX adjust training time
    }
}
