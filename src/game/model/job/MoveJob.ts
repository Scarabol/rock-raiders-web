import { Vector3 } from 'three'
import { Job, JobType } from './Job'

export class MoveJob extends Job {

    target: Vector3

    constructor(target: Vector3) {
        super(JobType.MOVE)
        this.target = target
    }

    getPosition(): Vector3 {
        return new Vector3().copy(this.target)
    }

    isInArea(x: number, z: number): boolean {
        return this.getPosition().distanceToSquared(new Vector3(x, this.target.y, z)) < Math.pow(this.fulfiller[0].getSpeed(), 2)
    }

}
