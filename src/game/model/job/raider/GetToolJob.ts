import { EntityManager } from '../../../EntityManager'
import { BuildingEntity } from '../../building/BuildingEntity'
import { EntityType } from '../../EntityType'
import { RaiderTool } from '../../raider/RaiderTool'
import { GetToolPathTarget } from './GetToolPathTarget'
import { RaiderJob } from './RaiderJob'

export class GetToolJob extends RaiderJob {

    entityMgr: EntityManager
    tool: RaiderTool
    workplaces: GetToolPathTarget[]

    constructor(entityMgr: EntityManager, tool: RaiderTool, toolstation: BuildingEntity) {
        super()
        this.entityMgr = entityMgr
        this.tool = tool
        this.workplaces = toolstation ? [toolstation.getPathTarget()] : this.entityMgr.getBuildingsByType(EntityType.TOOLSTATION).map((b) => new GetToolPathTarget(b))
    }

    getWorkplaces(): GetToolPathTarget[] {
        if (this.workplaces.some((b) => !b.building.isPowered())) {
            this.workplaces = this.entityMgr.getBuildingsByType(EntityType.TOOLSTATION).map((b) => new GetToolPathTarget(b))
        }
        return this.workplaces
    }

    onJobComplete() {
        super.onJobComplete()
        this.raider.addTool(this.tool)
    }

}
