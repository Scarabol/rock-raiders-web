import { Vector2 } from 'three'

export class PathTarget {
    constructor(readonly targetLocation: Vector2, readonly radiusSq: number = 0) {
    }

    getFocusPoint(): Vector2 {
        return this.targetLocation
    }

    isInvalid(): boolean {
        return false
    }
}
