import { Vector2 } from 'three'

export class BarrierLocation {
    position: Vector2
    heading: number

    constructor(position: Vector2, surfaceCenter: Vector2) {
        this.position = position
        this.heading = position.clone().sub(surfaceCenter).angle()
        if (position.y === surfaceCenter.y) {
            this.heading -= Math.PI / 2
        } else {
            this.heading += Math.PI / 2
        }
    }
}
