import { Job} from './Job'
import { Vector3 } from 'three'
import { TILESIZE } from '../../../main'
import { RaiderSkill } from '../../../scene/model/RaiderSkill'
import { JobType } from './JobType'

export class TrainJob extends Job {

    target: Vector3
    skill: RaiderSkill

    constructor(target: Vector3, skill: RaiderSkill) {
        super(JobType.TRAIN)
        this.target = target
        this.skill = skill
    }

    getPosition(): Vector3 {
        return new Vector3().copy(this.target)
    }

    isInArea(x: number, z: number): boolean {
        return this.getPosition().distanceToSquared(new Vector3(x, this.target.y, z)) < Math.pow(TILESIZE / 2, 2)
    }

}
