import { AbstractGameComponent } from '../ECS'
import { Vector2 } from 'three'

export class WorldTargetComponent extends AbstractGameComponent {
    readonly position: Vector2 = new Vector2()
    radiusSq: number = 0
}
