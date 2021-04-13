import { Job, JobType } from './Job'
import { Vector3 } from 'three'
import { JOB_ACTION_RANGE } from '../../../main'

export class GetToolJob extends Job {

    target: Vector3
    tool: string

    constructor(target: Vector3, tool: string) {
        super(JobType.GET_TOOL)
        this.target = target
        this.tool = tool
    }

    getPosition(): Vector3 {
        return new Vector3().copy(this.target)
    }

    isInArea(x: number, z: number): boolean {
        return this.getPosition().sub(new Vector3(x, this.target.y, z)).lengthSq() < JOB_ACTION_RANGE
    }

}
