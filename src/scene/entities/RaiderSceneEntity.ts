import { AnimationActivity, RaiderActivity } from '../../game/model/anim/AnimationActivity'
import { AnimatedSceneEntity } from '../AnimatedSceneEntity'
import { SceneEntity } from '../SceneEntity'

export class RaiderSceneEntity extends AnimatedSceneEntity {
    dropAllEntities(): SceneEntity[] {
        const dropped = super.dropAllEntities()
        dropped.forEach((d) => d.addToScene(d.position2D, null))
        this.changeActivity()
        return dropped
    }

    getDefaultActivity(): AnimationActivity {
        return this.carriedByIndex.size > 0 ? RaiderActivity.CarryStand : super.getDefaultActivity()
    }
}
