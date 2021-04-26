import { Vector2 } from 'three'
import { PathTarget } from '../../../scene/model/PathTarget'
import { Job } from './Job'
import { JobType } from './JobType'

export class MoveJob extends Job {

    target: PathTarget[]

    constructor(target: Vector2) {
        super(JobType.MOVE)
        this.target = [new PathTarget(target)]
    }

    getWorkplaces(): PathTarget[] {
        return this.target
    }

}
