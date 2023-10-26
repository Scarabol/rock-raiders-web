import { AbstractGameComponent } from '../ECS'
import { AnimationGroup } from '../../scene/AnimationGroup'
import { Vector2 } from 'three'
import { EntityType } from '../model/EntityType'

export class BulletComponent extends AbstractGameComponent {
    constructor(
        readonly bulletAnim: AnimationGroup,
        readonly targetLocation: Vector2,
        readonly bulletType: EntityType,
    ) {
        super()
    }
}
