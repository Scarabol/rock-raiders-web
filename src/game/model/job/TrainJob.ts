import { EventBus } from '../../../event/EventBus'
import { RaidersChangedEvent } from '../../../event/LocalEvents'
import { RaiderActivity } from '../activities/RaiderActivity'
import { BuildingEntity } from '../building/BuildingEntity'
import { FulfillerEntity } from '../FulfillerEntity'
import { GameState } from '../GameState'
import { PathTarget } from '../PathTarget'
import { RaiderTraining } from '../raider/RaiderTraining'
import { Job } from './Job'
import { JobType } from './JobType'

export class TrainJob extends Job {

    training: RaiderTraining
    building: BuildingEntity
    workplaces: PathTarget[]

    constructor(training: RaiderTraining, building: BuildingEntity) {
        super(JobType.TRAIN)
        this.training = training
        this.building = building
        this.workplaces = this.getWorkplaces()
    }

    getWorkplaces(): PathTarget[] {
        if (!this.building?.isUsable()) {
            this.workplaces = []
            GameState.getTrainingSites(this.training).map((s) => s.getTrainingTargets().forEach((t) => this.workplaces.push(t)))
        }
        return this.workplaces
    }

    onJobComplete() {
        super.onJobComplete()
        this.fulfiller.forEach((f) => {
            f.addTraining(this.training)
            EventBus.publishEvent(new RaidersChangedEvent(this.training))
        })
    }

    getWorkActivity(): RaiderActivity {
        return RaiderActivity.Train
    }

    getWorkDuration(fulfiller: FulfillerEntity): number {
        return 10000 // XXX adjust training time
    }

}
