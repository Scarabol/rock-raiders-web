import { RaiderActivity } from '../activities/RaiderActivity'
import { BuildingEntity } from '../building/BuildingEntity'
import { FulfillerEntity } from '../FulfillerEntity'
import { PathTarget } from '../PathTarget'
import { Job } from './Job'
import { JobType } from './JobType'

export class UpgradeJob extends Job {

    building: BuildingEntity
    workplaces: PathTarget[]

    constructor(building: BuildingEntity) {
        super(JobType.TRAIN)
        this.building = building
        this.workplaces = building.getTrainingTargets()
    }

    getWorkplaces(): PathTarget[] {
        return this.building.isUsable() ? this.workplaces : []
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
