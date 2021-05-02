import { RaiderActivity } from '../activities/RaiderActivity'
import { PathTarget } from '../PathTarget'
import { Job } from './Job'
import { JobType } from './JobType'

export class EatJob extends Job {

    constructor() {
        super(JobType.EAT)
    }

    getWorkplaces(): PathTarget[] {
        return this.fulfiller.map((f) => new PathTarget(f.getPosition2D()))
    }

    onJobComplete() {
        super.onJobComplete()
        // TODO implement endurance, fill eat level here
    }

    getWorkActivity(): RaiderActivity {
        return RaiderActivity.Eat
    }

}
