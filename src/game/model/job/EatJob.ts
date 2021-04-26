import { PathTarget } from '../PathTarget'
import { Job } from './Job'
import { JobType } from './JobType'

export class EatJob extends Job {

    constructor() {
        super(JobType.EAT)
    }

    getWorkplaces(): PathTarget[] {
        return []
    }

}
