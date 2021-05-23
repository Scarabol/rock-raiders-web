import { Vector2 } from 'three'
import { RaiderActivity } from './activities/RaiderActivity'
import { MaterialEntity } from './material/MaterialEntity'

export class PathTarget {

    targetLocation: Vector2

    constructor(location: Vector2) {
        this.targetLocation = location
    }

    canGatherItem(): boolean {
        return false
    }

    gatherItem(item: MaterialEntity) {
        item.addToScene(null, null)
    }

    getDropAction(): RaiderActivity {
        return RaiderActivity.Place
    }

}
