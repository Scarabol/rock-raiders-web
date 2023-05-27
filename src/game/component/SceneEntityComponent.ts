import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { AbstractGameComponent } from '../ECS'

export class SceneEntityComponent extends AbstractGameComponent {
    constructor(readonly sceneEntity: AnimatedSceneEntity) {
        super()
    }
}
