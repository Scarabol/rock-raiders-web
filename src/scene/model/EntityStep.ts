import { Vector3 } from 'three'

export class EntityStep {

    vec: Vector3 = null
    targetReached: boolean = false

    constructor(dx: number, dy: number, dz: number) {
        this.vec = new Vector3(dx, dy, dz)
    }

}
