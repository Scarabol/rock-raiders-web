import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { PathTarget } from '../../PathTarget'
import { RaiderJob } from './RaiderJob'
import { Raider } from '../../raider/Raider'
import { VehicleEntity } from '../../vehicle/VehicleEntity'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'
import { JobFulfiller } from '../Job'

export class EatJob extends RaiderJob {
    target: PathTarget = null

    getWorkplace(entity: Raider | VehicleEntity): PathTarget {
        if (!this.target) this.target = PathTarget.fromLocation(this.raider.getPosition2D())
        return this.target
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        this.raider.foodLevel = 1
        this.raider.infoComponent.setHungerIndicator(this.raider.foodLevel)
        super.onJobComplete(fulfiller)
    }

    getWorkActivity(): AnimationActivity {
        return RaiderActivity.Eat
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleEat'
    }
}
