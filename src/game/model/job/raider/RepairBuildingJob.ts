import { RaiderJob } from './RaiderJob'
import { BuildingEntity } from '../../building/BuildingEntity'
import { PathTarget } from '../../PathTarget'
import { JobFulfiller } from '../Job'
import { AnimationActivity, RAIDER_ACTIVITY } from '../../anim/AnimationActivity'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'
import { HealthComponent } from '../../../component/HealthComponent'
import { RAIDER_TOOL } from '../../raider/RaiderTool'
import { RAIDER_TRAINING } from '../../raider/RaiderTraining'
import { PRIORITY_IDENTIFIER } from '../PriorityIdentifier'

export class RepairBuildingJob extends RaiderJob {
    building: BuildingEntity
    workplaces: PathTarget[]

    constructor(building: BuildingEntity) {
        super()
        this.building = building
        this.workplaces = building.getTrainingTargets()
        this.requiredTool = RAIDER_TOOL.spanner
        this.requiredTraining = RAIDER_TRAINING.engineer
        this.priorityIdentifier = PRIORITY_IDENTIFIER.repair
    }

    getWorkplace(entity: JobFulfiller): PathTarget | undefined {
        const healthComponent = this.building.worldMgr.ecs.getComponents(this.building.entity).get(HealthComponent)
        if (healthComponent.health >= healthComponent.maxHealth) return undefined
        return entity.findShortestPath(this.workplaces)?.target
    }

    override onJobComplete(fulfiller: JobFulfiller): void {
        const healthComponent = this.building.worldMgr.ecs.getComponents(this.building.entity).get(HealthComponent)
        healthComponent.changeHealth(fulfiller.getRepairValue())
        if (healthComponent.health >= healthComponent.maxHealth) super.onJobComplete(fulfiller)
    }

    override getWorkActivity(): AnimationActivity {
        return RAIDER_ACTIVITY.repair
    }

    override getJobBubble(): keyof BubblesCfg {
        return 'bubbleRepair'
    }
}
