import { AbstractGameComponent } from '../ECS'
import { Vector2 } from 'three'

export class WorldTargetComponent extends AbstractGameComponent {
    constructor(readonly position = new Vector2(), readonly radiusSq: number = 1) {
        super()
    }
}
