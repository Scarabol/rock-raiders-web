import { Job } from './Job'
import { Vector2 } from 'three'
import { RaiderTool } from '../../../scene/model/RaiderTool'
import { JobType } from './JobType'

export class GetToolJob extends Job {

    target: Vector2
    tool: RaiderTool

    constructor(target: Vector2, tool: RaiderTool) {
        super(JobType.GET_TOOL)
        this.target = target
        this.tool = tool
    }

    getWorkplaces(): Vector2[] {
        return [this.target.clone()]
    }

}
