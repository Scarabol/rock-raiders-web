import { RaiderJob } from './RaiderJob'
import { Raider } from '../../raider/Raider'
import { PathTarget } from '../../PathTarget'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'
import { Vector2 } from 'three'
import { JobFulfiller } from '../Job'

export class RunPanicJob extends RaiderJob {
    runTarget: PathTarget

    constructor(runTarget: Vector2) {
        super()
        this.runTarget = PathTarget.fromLocation(runTarget)
    }

    getWorkplace(entity: Raider): PathTarget {
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
