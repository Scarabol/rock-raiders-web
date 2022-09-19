import { Vector2 } from 'three'
import { PathTarget } from '../../PathTarget'
import { RaiderJob } from './RaiderJob'

export class MoveJob extends RaiderJob {
    target: PathTarget[]

    constructor(target: Vector2) {
        super()
        this.target = [PathTarget.fromLocation(target)]
    }

    getWorkplaces(): PathTarget[] {
        return this.target
    }
}
