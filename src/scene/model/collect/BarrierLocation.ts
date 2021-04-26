import { Vector2 } from 'three'

export class BarrierLocation {

    location: Vector2
    heading: number

    constructor(location: Vector2, surfaceCenter: Vector2) {
        this.location = location
        this.heading = location.clone().sub(surfaceCenter).angle()
        if (location.y === surfaceCenter.y) {
            this.heading -= Math.PI / 2
        } else {
            this.heading += Math.PI / 2
        }
    }

}
