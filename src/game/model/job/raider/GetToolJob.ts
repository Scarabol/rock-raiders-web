import { EntityManager } from '../../../EntityManager'
import { BuildingEntity } from '../../building/BuildingEntity'
import { BuildingPathTarget } from '../../building/BuildingPathTarget'
import { EntityType } from '../../EntityType'
import { RaiderTool } from '../../raider/RaiderTool'
import { RaiderJob } from './RaiderJob'

export class GetToolJob extends RaiderJob {

    entityMgr: EntityManager
    tool: RaiderTool
    workplaces: BuildingPathTarget[]

    constructor(entityMgr: EntityManager, tool: RaiderTool, toolstation: BuildingEntity) {
        super()
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
        this.raider.addTool(this.tool)
    }

}
