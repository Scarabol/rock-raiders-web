import { AbstractGameComponent } from '../ECS'
import { Vector2 } from 'three'
import { Surface } from '../terrain/Surface'

export class BirdScarerComponent extends AbstractGameComponent {
    constructor(readonly position2D: Vector2, readonly surface: Surface) {
        super()
    }
}
