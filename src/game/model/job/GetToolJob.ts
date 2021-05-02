import { Vector2 } from 'three'
import { PathTarget } from '../PathTarget'
import { RaiderTool } from '../raider/RaiderTool'
import { Job } from './Job'
import { JobType } from './JobType'

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

    onJobComplete() {
        super.onJobComplete()
        this.fulfiller.forEach((f) => f.addTool(this.tool))
    }

}
