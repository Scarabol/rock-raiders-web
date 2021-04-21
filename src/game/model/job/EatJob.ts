import { Job } from './Job'
import { JobType } from './JobType'
import { PathTarget } from '../../../scene/model/PathTarget'

export class EatJob extends Job {

    constructor() {
        super(JobType.EAT)
    }

    getWorkplaces(): PathTarget[] {
        return []
    }

}
