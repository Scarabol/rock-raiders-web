import { EntityManager } from '../../EntityManager'
import { BuildingEntity } from '../building/BuildingEntity'
import { BuildingPathTarget } from '../building/BuildingPathTarget'
import { EntityType } from '../EntityType'
import { RaiderTool } from '../raider/RaiderTool'
import { Job } from './Job'
import { JobType } from './JobType'

export class GetToolJob extends Job {

    entityMgr: EntityManager
    tool: RaiderTool
    workplaces: BuildingPathTarget[]

    constructor(entityMgr: EntityManager, tool: RaiderTool, toolstation: BuildingEntity) {
        super(JobType.GET_TOOL)
        this.entityMgr = entityMgr
        this.tool = tool
        this.workplaces = toolstation ? [toolstation.getPathTarget()] : this.entityMgr.getBuildingsByType(EntityType.TOOLSTATION).map((b) => new BuildingPathTarget(b))
    }

    getWorkplaces(): BuildingPathTarget[] {
        if (this.workplaces.some((b) => !b.building.isUsable())) {
            this.workplaces = this.entityMgr.getBuildingsByType(EntityType.TOOLSTATION).map((b) => new BuildingPathTarget(b))
        }
        return this.workplaces
    }

    onJobComplete() {
        super.onJobComplete()
        this.fulfiller.forEach((f) => f.addTool(this.tool))
    }

}
