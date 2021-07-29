import { Vector3 } from 'three'

export class EntityStep {
    vec: Vector3 = null
    targetReached: boolean = false

    constructor(vec: Vector3) {
        this.vec = vec
    }
}
