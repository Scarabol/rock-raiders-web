import { RaiderJob } from './RaiderJob'
import { JobFulfiller } from '../Job'
import { PathTarget } from '../../PathTarget'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'
import { Vector2 } from 'three'

export class RunPanicJob extends RaiderJob {
    runTarget: PathTarget

    constructor(runTarget: Vector2) {
        super()
        this.runTarget = PathTarget.fromLocation(runTarget)
    }

    getWorkplace(entity: JobFulfiller): PathTarget | undefined {
        return this.runTarget
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleFlee'
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        super.onJobComplete(fulfiller)
        if (this.raider) this.raider.scared = false
    }
}
