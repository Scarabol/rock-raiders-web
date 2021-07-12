import { Vector2 } from 'three'
import { AnimEntityActivity } from '../../game/model/activities/AnimEntityActivity'
import { AnimatedSceneEntity } from '../AnimatedSceneEntity'
import { SceneEntity } from '../SceneEntity'

export class FulfillerSceneEntity extends AnimatedSceneEntity {

    carriedEntity: SceneEntity

    pickupEntity(entity: SceneEntity) {
        if (this.carriedEntity === entity) return
        this.dropEntity()
        this.carriedEntity = entity
        this.addCarried()
        this.carriedEntity.position.set(0, 0, 0)
    }

    dropEntity() {
        if (!this.carriedEntity) return
        const position = this.position.clone()
        if (this.animation?.carryJoint) {
            this.animation.carryJoint.remove(this.carriedEntity.group)
            this.animation.carryJoint.getWorldPosition(position)
        }
        this.carriedEntity.addToScene(new Vector2(position.x, position.z), null)
        this.carriedEntity = null
        this.changeActivity()
    }

    changeActivity(activity: AnimEntityActivity = this.getDefaultActivity(), onAnimationDone: () => any = null, durationTimeMs: number = null) {
        super.changeActivity(activity, onAnimationDone, durationTimeMs)
        this.addCarried() // keep carried children
    }

    private addCarried() {
        if (!this.carriedEntity) return
        (this.animation?.carryJoint || this).add(this.carriedEntity.group)
    }

}
