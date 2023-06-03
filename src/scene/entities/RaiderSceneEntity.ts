import { AnimationActivity, RaiderActivity } from '../../game/model/anim/AnimationActivity'
import { LegacyAnimatedSceneEntity } from '../LegacyAnimatedSceneEntity'
import { SceneEntity } from '../SceneEntity'

/**
 * @deprecated
 */
export class RaiderSceneEntity extends LegacyAnimatedSceneEntity {
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
