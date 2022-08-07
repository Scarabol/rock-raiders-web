import { AbstractGameComponent } from '../ECS'
import { AnimatedMeshGroup } from '../../scene/AnimatedMeshGroup'

export class SceneEntityComponent extends AbstractGameComponent {
    constructor(readonly sceneEntity: AnimatedMeshGroup) {
        super()
    }
}
