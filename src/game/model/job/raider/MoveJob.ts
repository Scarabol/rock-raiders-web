import { Vector2 } from 'three'
import { PathTarget } from '../../PathTarget'
import { RaiderJob } from './RaiderJob'
import { Raider } from '../../raider/Raider'
import { VehicleEntity } from '../../vehicle/VehicleEntity'

export class MoveJob extends RaiderJob {
    target: PathTarget

    constructor(target: Vector2) {
        super()
        this.target = PathTarget.fromLocation(target)
    }

    getWorkplace(entity: Raider | VehicleEntity): PathTarget {
        return this.target
    }
}
