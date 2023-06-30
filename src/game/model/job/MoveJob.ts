import { Vector2 } from 'three'
import { PathTarget } from '../PathTarget'
import { AbstractJob, JobFulfiller } from './Job'
import { Raider } from '../raider/Raider'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { BubblesCfg } from '../../../cfg/BubblesCfg'

export class MoveJob extends AbstractJob {
    readonly target: PathTarget
    fulfiller: JobFulfiller = null

    constructor(target: Vector2) {
        super()
        this.target = PathTarget.fromLocation(target)
    }

    getWorkplace(entity: Raider | VehicleEntity): PathTarget {
        return this.target
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleGoto'
    }

    assign(fulfiller: JobFulfiller) {
        if (this.fulfiller !== fulfiller) this.fulfiller?.stopJob()
        this.fulfiller = fulfiller
    }

    unAssign(fulfiller: JobFulfiller) {
        if (this.fulfiller !== fulfiller) return
        this.fulfiller = fulfiller
    }
}
