import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { PathTarget } from '../../PathTarget'
import { RaiderJob } from './RaiderJob'
import { Raider } from '../../raider/Raider'
import { VehicleEntity } from '../../vehicle/VehicleEntity'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'

export class EatJob extends RaiderJob {
    target: PathTarget = null

    getWorkplace(entity: Raider | VehicleEntity): PathTarget {
        if (!this.target) this.target = PathTarget.fromLocation(this.raider.sceneEntity.position2D)
        return this.target
    }

    onJobComplete() {
        this.raider.hungerLevel = 1
        super.onJobComplete()
    }

    getWorkActivity(): AnimationActivity {
        return RaiderActivity.Eat
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleEat'
    }
}
