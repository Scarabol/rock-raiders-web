import { Vector2 } from 'three'
import { PathTarget } from '../PathTarget'
import { Job, JobFulfiller } from './Job'
import { Raider } from '../raider/Raider'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { BubblesCfg } from '../../../cfg/BubblesCfg'

export class MoveJob extends Job {
    readonly target: PathTarget

    constructor(readonly location: Vector2) {
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
        // This job should be always assigned
    }

    unAssign(fulfiller: JobFulfiller) {
        // This job should not be unassigned
    }

    hasFulfiller(): boolean {
        return true
    }
}
