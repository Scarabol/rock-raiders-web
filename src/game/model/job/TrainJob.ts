import { Job } from './Job'
import { Vector2 } from 'three'
import { RaiderSkill } from '../../../scene/model/RaiderSkill'
import { JobType } from './JobType'

export class TrainJob extends Job {

    target: Vector2
    skill: RaiderSkill

    constructor(target: Vector2, skill: RaiderSkill) {
        super(JobType.TRAIN)
        this.target = target
        this.skill = skill
    }

    getWorkplaces(): Vector2[] {
        return [this.target.clone()]
    }

}
