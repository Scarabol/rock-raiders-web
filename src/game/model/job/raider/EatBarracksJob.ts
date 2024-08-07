import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { PathTarget } from '../../PathTarget'
import { RaiderJob } from './RaiderJob'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'
import { JobFulfiller } from '../Job'
import { RaiderInfoComponent } from '../../../component/RaiderInfoComponent'
import { EntityManager } from '../../../EntityManager'
import { BuildingEntity } from '../../building/BuildingEntity'

export class EatBarracksJob extends RaiderJob {
    building?: BuildingEntity
    workplaces: PathTarget[]

    constructor(readonly entityMgr: EntityManager, building: BuildingEntity) {
        super()
        this.building = building
        this.workplaces = this.building?.getTrainingTargets()
    }

    getWorkplace(entity: JobFulfiller): PathTarget | undefined {
        if (!this.building?.isPowered()) this.workplaces = this.entityMgr.getRaiderEatPathTarget()
        const target = entity.findShortestPath(this.workplaces)?.target
        this.building = target?.building
        return target
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        super.onJobComplete(fulfiller)
        if (!this.raider) return
        this.raider.foodLevel += 0.25
        this.raider.worldMgr.ecs.getComponents(this.raider.entity).get(RaiderInfoComponent).setHungerIndicator(this.raider.foodLevel)
        if (this.raider.foodLevel < 1 && this.building) this.raider.setJob(new EatBarracksJob(this.entityMgr, this.building))
    }

    getWorkActivity(): AnimationActivity {
        return RaiderActivity.Eat
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleEat'
    }
}
