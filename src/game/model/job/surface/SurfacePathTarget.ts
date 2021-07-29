import { Vector2 } from 'three'
import { Surface } from '../../map/Surface'
import { PathTarget } from '../../PathTarget'

export class SurfacePathTarget extends PathTarget {
    surface: Surface

    constructor(location: Vector2, surface: Surface) {
        super(location)
        this.surface = surface
    }

    getFocusPoint(): Vector2 {
        return this.surface.getCenterWorld2D()
    }

    isInvalid(): boolean {
        return !this.surface.isDigable()
    }
}
