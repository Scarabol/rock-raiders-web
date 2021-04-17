import { Job} from './Job'
import { Vector3 } from 'three'
import { JOB_ACTION_RANGE } from '../../../main'
import { RaiderTool } from '../../../scene/model/RaiderTool'
import { JobType } from './JobType'

export class GetToolJob extends Job {

    target: Vector3
    tool: RaiderTool

    constructor(target: Vector3, tool: RaiderTool) {
        super(JobType.GET_TOOL)
        this.target = target
        this.tool = tool
    }

    getPosition(): Vector3 {
        return new Vector3().copy(this.target)
    }

    isInArea(x: number, z: number): boolean {
        return this.getPosition().distanceToSquared(new Vector3(x, this.target.y, z)) < JOB_ACTION_RANGE
    }

}
