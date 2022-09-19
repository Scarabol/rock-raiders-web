import { Vector2 } from 'three'
import { RaiderActivity } from '../../activities/RaiderActivity'
import { MaterialEntity } from '../../material/MaterialEntity'
import { PathTarget } from '../../PathTarget'
import { CarryJob } from './CarryJob'

export class CarryPathTarget extends PathTarget {
    constructor(location: Vector2, radiusSq: number = 0) {
        super(location, null, null, radiusSq)
    }

    reserveGatherSlot(job: CarryJob): boolean {
        return true
    }

    gatherItem(item: MaterialEntity) {
        item.sceneEntity.addToScene(null, null)
    }

    getDropAction(): RaiderActivity {
        return RaiderActivity.Place
    }
}
