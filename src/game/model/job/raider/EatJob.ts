import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { PathTarget } from '../../PathTarget'
import { RaiderJob } from './RaiderJob'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'
import { JobFulfiller } from '../Job'
import { RaiderInfoComponent } from '../../../component/RaiderInfoComponent'

export class EatJob extends RaiderJob {
    target: PathTarget

    getWorkplace(entity: JobFulfiller): PathTarget {
        if (!this.target) this.target = PathTarget.fromLocation(this.raider.getPosition2D())
        return this.target
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        this.raider.foodLevel = 1
        this.raider.worldMgr.ecs.getComponents(this.raider.entity).get(RaiderInfoComponent).setHungerIndicator(this.raider.foodLevel)
        super.onJobComplete(fulfiller)
    }

    getWorkActivity(): AnimationActivity {
        return RaiderActivity.Eat
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleEat'
    }
}
