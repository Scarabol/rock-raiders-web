import { RaiderActivity } from '../activities/RaiderActivity'
import { FulfillerEntity } from '../FulfillerEntity'
import { Surface } from '../map/Surface'
import { Job } from './Job'
import { JobType } from './JobType'
import { TrainingPathTarget } from './TrainingPathTarget'

export class UpgradeJob extends Job {

    workplaces: TrainingPathTarget[]

    constructor(surface: Surface) {
        super(JobType.TRAIN)
        this.workplaces = [new TrainingPathTarget(surface)]
    }

    getWorkplaces(): TrainingPathTarget[] {
        return this.workplaces
    }

    onJobComplete() {
        super.onJobComplete()
        this.fulfiller.forEach((f) => {
            if (f.level < f.stats.Levels) f.level++
        })
    }

    getWorkActivity(): RaiderActivity {
        return RaiderActivity.Train
    }

    getWorkDuration(fulfiller: FulfillerEntity): number {
        return 30000 // XXX adjust upgrade time
    }

}
