import { Vector3 } from 'three'

export class EntityStep {
    targetReached: boolean = false

    constructor(
        readonly vec: Vector3,
    ) {
    }
}
