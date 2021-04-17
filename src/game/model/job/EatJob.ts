import { Vector2 } from 'three'
import { Job } from './Job'
import { JobType } from './JobType'

export class EatJob extends Job {

    constructor() {
        super(JobType.EAT)
    }

    getWorkplaces(): Vector2[] {
        return []
    }

}
