import { Vector2 } from 'three'
import { PathTarget } from '../PathTarget'
import { Job, JobFulfiller } from './Job'
import { BubblesCfg } from '../../../cfg/BubblesCfg'

export class MoveJob extends Job {
    readonly target: PathTarget

    constructor(readonly location: Vector2) {
        super()
        this.target = PathTarget.fromLocation(location)
        this.doOnAlarm = true
    }

    getWorkplace(_entity: JobFulfiller): PathTarget | undefined {
        return this.target
    }

    override getJobBubble(): keyof BubblesCfg {
        return 'bubbleGoto'
    }

    assign(_fulfiller: JobFulfiller) {
        // This job should be always assigned
    }

    unAssign(_fulfiller: JobFulfiller) {
        // This job should not be unassigned
    }

    hasFulfiller(): boolean {
        return true
    }
}
