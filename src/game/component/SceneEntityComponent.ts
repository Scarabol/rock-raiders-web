import { AbstractGameComponent } from '../ECS'
import { AnimatedMeshGroup } from '../../scene/AnimatedMeshGroup'
import { Vector2, Vector3 } from 'three'
import { AnimEntityActivity } from '../model/anim/AnimationActivity'

export class SceneEntityComponent extends AbstractGameComponent {
    constructor(readonly sceneEntity: AnimatedMeshGroup) {
        super()
    }

    move(position: Vector3, floorOffset: number) {
        this.sceneEntity.position.copy(position)
        this.sceneEntity.position.y += floorOffset
        this.sceneEntity.setAnimation(AnimEntityActivity.Route)
    }

    headTowards(location: Vector2) {
        this.sceneEntity.lookAt(new Vector3(location.x, this.sceneEntity.position.y, location.y)) // XXX externalize look at vector
    }
}
