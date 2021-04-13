import { Vector3 } from 'three'
import { Job, JobType } from './Job'

export class EatJob extends Job {

    constructor() {
        super(JobType.EAT)
    }

    getPosition(): Vector3 {
        return null
    }

    isInArea(x: number, z: number): boolean {
        return true
    }

}
