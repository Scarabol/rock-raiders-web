import { AbstractGameComponent } from '../ECS'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'

export class AnimatedSceneEntityComponent extends AbstractGameComponent {
    constructor(readonly sceneEntity: AnimatedSceneEntity) {
        super()
    }
}
