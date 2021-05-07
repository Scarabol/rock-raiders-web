import { EventBus } from '../../../event/EventBus'
import { EntityTrained } from '../../../event/WorldEvents'
import { RaiderActivity } from '../activities/RaiderActivity'
import { BuildingEntity } from '../building/BuildingEntity'
import { FulfillerEntity } from '../FulfillerEntity'
import { PathTarget } from '../PathTarget'
import { RaiderTraining } from '../raider/RaiderTraining'
import { Job } from './Job'
import { JobType } from './JobType'

export class TrainJob extends Job {

    building: BuildingEntity
    workplaces: PathTarget[]
    training: RaiderTraining

    constructor(building: BuildingEntity, training: RaiderTraining) {
        super(JobType.TRAIN)
        this.building = building
        this.workplaces = building.getTrainingTargets()
        this.training = training
    }

    getWorkplaces(): PathTarget[] {
        return this.building.isPowered() ? this.workplaces : []
    }

    onJobComplete() {
        super.onJobComplete()
        this.fulfiller.forEach((f) => {
            f.addTraining(this.training)
            EventBus.publishEvent(new EntityTrained(f, this.training))
        })
    }

    getWorkActivity(): RaiderActivity {
        return RaiderActivity.Train
    }

    getWorkDuration(fulfiller: FulfillerEntity): number {
        return 10000 // XXX adjust training time
    }

}
