import { AnimationActivity, RAIDER_ACTIVITY } from '../../anim/AnimationActivity'
import { PathTarget } from '../../PathTarget'
import { RaiderJob } from './RaiderJob'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'
import { JobFulfiller } from '../Job'
import { RaiderInfoComponent } from '../../../component/RaiderInfoComponent'

export class EatJob extends RaiderJob {
    target: PathTarget | undefined

    getWorkplace(_entity: JobFulfiller): PathTarget | undefined {
        if (!this.target && this.raider) this.target = PathTarget.fromLocation(this.raider.getPosition2D())
        return this.target
    }

    override onJobComplete(fulfiller: JobFulfiller): void {
        super.onJobComplete(fulfiller)
        if (!this.raider) return
        this.raider.foodLevel = 1
        this.raider.worldMgr.ecs.getComponents(this.raider.entity).get(RaiderInfoComponent).setHungerIndicator(this.raider.foodLevel)
    }

    override getWorkActivity(): AnimationActivity {
        return RAIDER_ACTIVITY.eat
    }

    override getJobBubble(): keyof BubblesCfg {
        return 'bubbleEat'
    }
}
