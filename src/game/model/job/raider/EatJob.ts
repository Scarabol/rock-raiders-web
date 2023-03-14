import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { PathTarget } from '../../PathTarget'
import { RaiderJob } from './RaiderJob'

export class EatJob extends RaiderJob {
    target: PathTarget[] = []

    getWorkplaces(): PathTarget[] {
        if (this.target.length < 1) this.target = [PathTarget.fromLocation(this.raider.sceneEntity.position2D)]
        return this.target
    }

    onJobComplete() {
        this.raider.hungerLevel = 1
        super.onJobComplete()
    }

    getWorkActivity(): AnimationActivity {
        return RaiderActivity.Eat
    }
}
