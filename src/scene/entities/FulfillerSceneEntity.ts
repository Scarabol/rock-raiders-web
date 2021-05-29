import { Vector2 } from 'three'
import { BaseActivity } from '../../game/model/activities/BaseActivity'
import { RaiderActivity } from '../../game/model/activities/RaiderActivity'
import { AnimatedSceneEntity } from '../AnimatedSceneEntity'
import { SceneEntity } from '../SceneEntity'

export class FulfillerSceneEntity extends AnimatedSceneEntity {

    carriedEntity: SceneEntity

    pickupEntity(entity: SceneEntity) {
        if (this.carriedEntity === entity) return
        this.dropEntity()
        this.carriedEntity = entity;
        (this.animation?.carryJoint || this).add(this.carriedEntity.group)
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
    }

    getDefaultActivity(): BaseActivity {
        return this.carriedEntity ? RaiderActivity.CarryStand : super.getDefaultActivity()
    }

}
