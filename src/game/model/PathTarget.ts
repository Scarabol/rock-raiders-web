import { Vector2 } from 'three'
import { RaiderActivity } from './activities/RaiderActivity'
import { MaterialEntity } from './material/MaterialEntity'

export class PathTarget {
    targetLocation: Vector2
    radiusSq: number

    constructor(location: Vector2, radiusSq: number = 0) {
        this.targetLocation = location
        this.radiusSq = radiusSq
    }

    getFocusPoint(): Vector2 {
        return this.targetLocation
    }

    canGatherItem(): boolean {
        return false
    }

    gatherItem(item: MaterialEntity) {
        item.sceneEntity.addToScene(null, null)
    }

    getDropAction(): RaiderActivity {
        return RaiderActivity.Place
    }

    isInvalid(): boolean {
        return false
    }
}
