import { AbstractGameComponent } from '../ECS'
import { Vector2 } from 'three'

export class HeadingComponent extends AbstractGameComponent {
    constructor(
        readonly location: Vector2,
    ) {
        super()
    }
}
