import { RaiderJob } from './RaiderJob'
import { JobFulfiller } from '../Job'
import { PathTarget } from '../../PathTarget'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'
import { Vector2 } from 'three'
import { Raider } from '../../raider/Raider'

export class RunPanicJob extends RaiderJob {
    runTarget: PathTarget

    constructor(runTarget: Vector2) {
        super()
        this.runTarget = PathTarget.fromLocation(runTarget)
    }

    getWorkplace(_entity: JobFulfiller): PathTarget | undefined {
        return this.runTarget
    }

    override getJobBubble(): keyof BubblesCfg {
        return 'bubbleFlee'
    }

    override unAssign(raider: Raider) {
        super.unAssign(raider)
        if (this.raider) this.raider.scared = false
    }
}
