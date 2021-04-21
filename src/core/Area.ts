import { Vector2 } from 'three'

export class Area {

    x0: number = 0
    y0: number = 0
    x1: number = 0
    y1: number = 0
    center: Vector2 = null

    constructor(x0: number, y0: number, x1: number, y1: number) {
        this.x0 = x0
        this.y0 = y0
        this.x1 = x1
        this.y1 = y1
        this.center = new Vector2((this.x0 + this.x1) / 2, (this.y0 + this.y1) / 2)
    }

    getCenter(): Vector2 {
        return this.center.clone()
    }

}
