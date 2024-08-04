import { RaiderJob } from './RaiderJob'
import { BuildingEntity } from '../../building/BuildingEntity'
import { PathTarget } from '../../PathTarget'
import { JobFulfiller } from '../Job'
import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'
import { HealthComponent } from '../../../component/HealthComponent'
import { RaiderTool } from '../../raider/RaiderTool'
import { RaiderTraining } from '../../raider/RaiderTraining'
import { PriorityIdentifier } from '../PriorityIdentifier'

export class RepairBuildingJob extends RaiderJob {
    building: BuildingEntity
    workplaces: PathTarget[]

    constructor(building: BuildingEntity) {
        super()
        this.building = building
        this.workplaces = building.getTrainingTargets()
        this.requiredTool = RaiderTool.SPANNER
        this.requiredTraining = RaiderTraining.ENGINEER
        this.priorityIdentifier = PriorityIdentifier.REPAIR
    }

    getWorkplace(entity: JobFulfiller): PathTarget {
        const healthComponent = this.building.worldMgr.ecs.getComponents(this.building.entity).get(HealthComponent)
        if (healthComponent.health >= healthComponent.maxHealth) return null
        return entity.findShortestPath(this.workplaces)?.target
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        const healthComponent = this.building.worldMgr.ecs.getComponents(this.building.entity).get(HealthComponent)
        healthComponent.changeHealth(fulfiller.getRepairValue())
        if (healthComponent.health >= healthComponent.maxHealth) super.onJobComplete(fulfiller)
    }

    getWorkActivity(): AnimationActivity {
        return RaiderActivity.Repair
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleRepair'
    }
}
