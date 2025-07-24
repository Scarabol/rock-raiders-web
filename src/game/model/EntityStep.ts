import { Vector2, Vector3 } from 'three'

export class EntityStep {

    constructor(
        readonly position: Vector3,
        readonly focusPoint: Vector2,
        readonly stepLength: number,
        readonly targetReached: boolean = false
    ) {
    }
}
