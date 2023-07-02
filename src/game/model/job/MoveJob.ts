import { Vector2 } from 'three'
import { PathTarget } from '../PathTarget'
import { AbstractJob, JobFulfiller } from './Job'
import { Raider } from '../raider/Raider'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { BubblesCfg } from '../../../cfg/BubblesCfg'

export class MoveJob extends AbstractJob {
    readonly target: PathTarget

    constructor(readonly fulfiller: JobFulfiller, readonly location: Vector2) {
        super()
        this.target = PathTarget.fromLocation(location)
    }

    getWorkplace(entity: Raider | VehicleEntity): PathTarget {
        return this.target
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleGoto'
    }

    assign(fulfiller: JobFulfiller) {
        if (this.fulfiller === fulfiller) return
        throw new Error('Job already assigned')
    }

    unAssign(fulfiller: JobFulfiller) {
        // This job should not be unassigned
    }
}
