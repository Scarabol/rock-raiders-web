import { Job } from './Job'
import { Vector2 } from 'three'
import { RaiderTool } from '../../../scene/model/RaiderTool'
import { JobType } from './JobType'
import { PathTarget } from '../../../scene/model/PathTarget'

export class GetToolJob extends Job {

    target: PathTarget[]
    tool: RaiderTool

    constructor(target: Vector2, tool: RaiderTool) {
        super(JobType.GET_TOOL)
        this.target = [new PathTarget(target)]
        this.tool = tool
    }

    getWorkplaces(): PathTarget[] {
        return this.target
    }

}
