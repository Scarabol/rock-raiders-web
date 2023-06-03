import { AbstractGameComponent } from '../ECS'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { Vector2, Vector3 } from 'three'
import { AnimEntityActivity } from '../model/anim/AnimationActivity'

export class AnimatedSceneEntityComponent extends AbstractGameComponent {
    readonly lookAt: Vector3 = new Vector3()

    constructor(readonly sceneEntity: AnimatedSceneEntity) {
        super()
    }

    move(position: Vector3, floorOffset: number) {
        this.sceneEntity.position.copy(position)
        this.sceneEntity.position.y += floorOffset
        this.sceneEntity.setAnimation(AnimEntityActivity.Route)
    }

    headTowards(location: Vector2) {
        this.lookAt.set(location.x, this.sceneEntity.position.y, location.y)
        this.sceneEntity.lookAt(this.lookAt)
    }
}
