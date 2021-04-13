import { Job, JobType } from './Job'
import { Vector3 } from 'three'
import { TILESIZE } from '../../../main'

export class TrainJob extends Job {

    target: Vector3
    skill: string

    constructor(target: Vector3, skill: string) {
        super(JobType.TRAIN)
        this.target = target
        this.skill = skill
    }

    getPosition(): Vector3 {
        return new Vector3().copy(this.target)
    }

    isInArea(x: number, z: number): boolean {
        return this.getPosition().sub(new Vector3(x, this.target.y, z)).lengthSq() < Math.pow(TILESIZE / 2, 2)
    }

}
