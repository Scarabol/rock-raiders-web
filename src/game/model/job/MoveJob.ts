import { Vector2 } from 'three'
import { Job } from './Job'
import { JobType } from './JobType'

export class MoveJob extends Job {

    target: Vector2

    constructor(target: Vector2) {
        super(JobType.MOVE)
        this.target = target
    }

    getWorkplaces(): Vector2[] {
        return [this.target.clone()]
    }

}
