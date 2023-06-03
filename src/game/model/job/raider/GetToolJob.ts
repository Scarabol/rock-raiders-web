import { EntityManager } from '../../../EntityManager'
import { BuildingEntity } from '../../building/BuildingEntity'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { RaiderJob } from './RaiderJob'
import { Raider } from '../../raider/Raider'
import { VehicleEntity } from '../../vehicle/VehicleEntity'

export class GetToolJob extends RaiderJob {
    entityMgr: EntityManager
    tool: RaiderTool
    workplaces: PathTarget[]

    constructor(entityMgr: EntityManager, tool: RaiderTool, toolstation: BuildingEntity) {
        super()
        this.entityMgr = entityMgr
        this.tool = tool
        this.workplaces = toolstation ? [toolstation.getToolPathTarget] : this.entityMgr.getGetToolTargets()
    }

    getWorkplace(entity: Raider | VehicleEntity): PathTarget {
        if (this.workplaces.some((b) => !b.building.isPowered())) {
            this.workplaces = this.entityMgr.getGetToolTargets()
        }
        return this.workplaces
            .map((b) => entity.findPathToTarget(b))
            .filter((t) => !!t)
            .sort((l, r) => l.lengthSq - r.lengthSq)[0].target
    }

    onJobComplete() {
        super.onJobComplete()
        this.raider.addTool(this.tool)
    }
}
