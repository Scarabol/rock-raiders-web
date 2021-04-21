import { Vector2 } from 'three'

export class PathTarget {

    targetLocation: Vector2

    constructor(location: Vector2) {
        this.targetLocation = location
    }

    isInArea(position: Vector2): boolean {
        return false
    }

}
