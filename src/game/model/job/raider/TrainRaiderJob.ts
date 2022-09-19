import { EventBus } from '../../../../event/EventBus'
import { RaiderTrainingCompleteEvent } from '../../../../event/LocalEvents'
import { EntityManager } from '../../../EntityManager'
import { RaiderActivity } from '../../activities/RaiderActivity'
import { BuildingEntity } from '../../building/BuildingEntity'
import { PathTarget } from '../../PathTarget'
import { RaiderTraining } from '../../raider/RaiderTraining'
import { RaiderJob } from './RaiderJob'

export class TrainRaiderJob extends RaiderJob {
    building: BuildingEntity
    workplaces: PathTarget[]

    constructor(readonly entityMgr: EntityManager, readonly training: RaiderTraining, building: BuildingEntity) {
        super()
        this.building = building
        this.workplaces = this.building?.getTrainingTargets()
    }

    getWorkplaces(): PathTarget[] {
        if (!this.building?.isPowered()) this.workplaces = this.entityMgr.getTrainingSiteTargets(this.training)
        return this.workplaces
    }

    setActualWorkplace(target: PathTarget) {
        super.setActualWorkplace(target)
        this.building = target.building
    }

    onJobComplete() {
        super.onJobComplete()
        this.raider.addTraining(this.training)
        EventBus.publishEvent(new RaiderTrainingCompleteEvent(this.training))
    }

    getWorkActivity(): RaiderActivity {
        return RaiderActivity.Train
    }

    getExpectedTimeLeft(): number {
        return 10000 // XXX adjust training time
    }
}
