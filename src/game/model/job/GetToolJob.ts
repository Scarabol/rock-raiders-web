import { BuildingEntity } from '../building/BuildingEntity'
import { BuildingPathTarget } from '../BuildingPathTarget'
import { EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { RaiderTool } from '../raider/RaiderTool'
import { Job } from './Job'
import { JobType } from './JobType'

export class GetToolJob extends Job {

    tool: RaiderTool
    workplaces: BuildingPathTarget[]

    constructor(tool: RaiderTool, toolstation: BuildingEntity) {
        super(JobType.GET_TOOL)
        this.tool = tool
        this.workplaces = toolstation ? [toolstation.getPathTarget()] : GameState.getBuildingsByType(EntityType.TOOLSTATION).map((b) => new BuildingPathTarget(b))
    }

    getWorkplaces(): BuildingPathTarget[] {
        if (this.workplaces.some((b) => !b.building.isUsable())) {
            this.workplaces = GameState.getBuildingsByType(EntityType.TOOLSTATION).map((b) => new BuildingPathTarget(b))
        }
        return this.workplaces
    }

    onJobComplete() {
        super.onJobComplete()
        this.fulfiller.forEach((f) => f.addTool(this.tool))
    }

}
