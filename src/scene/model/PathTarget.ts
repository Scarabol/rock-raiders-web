import { Vector2 } from 'three'
import { Area } from '../../core/Area'

export class PathTarget {

    targetLocation: Vector2

    constructor(location: Vector2) {
        this.targetLocation = location
    }

    isInArea(position: Vector2): boolean {
        return false
    }

}

export class SurfacePathTarget extends PathTarget {

    trainingArea: Area

    constructor(trainingArea: Area) {
        super(trainingArea.getCenter())
        this.trainingArea = trainingArea
    }

    isInArea(position: Vector2): boolean {
        return position.x >= this.trainingArea.x0 && position.x < this.trainingArea.x1
            && position.y >= this.trainingArea.y0 && position.y < this.trainingArea.y1
    }

}
