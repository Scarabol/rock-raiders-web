import { AnimEntityActivity } from '../../game/model/activities/AnimEntityActivity'
import { AnimationEntityUpgrade } from '../../game/model/anim/AnimationEntityUpgrade'
import { VehicleActivity } from '../../game/model/vehicle/VehicleActivity'
import { SceneManager } from '../../game/SceneManager'
import { AnimatedSceneEntity } from '../AnimatedSceneEntity'
import { SceneMesh } from '../SceneMesh'
import { FulfillerSceneEntity } from './FulfillerSceneEntity'

export class WalkerDiggerSceneEntity extends FulfillerSceneEntity {

    body: AnimatedSceneEntity = null

    constructor(sceneMgr: SceneManager) {
        super(sceneMgr, 'Vehicles/WalkerLegs/WalkerLegs.ae')
        this.body = new AnimatedSceneEntity(sceneMgr, 'Vehicles/WalkerBody/WalkerBody.ae')
        this.add(this.body.group)
    }

    changeActivity(activity: AnimEntityActivity = this.getDefaultActivity(), onAnimationDone: () => any = null, durationTimeMs: number = null) {
        if (this.body.activity === activity) return
        this.body.changeActivity(activity, onAnimationDone, durationTimeMs)
        if (activity === VehicleActivity.Route || activity === VehicleActivity.TeleportIn) {
            super.changeActivity(activity)
        } else {
            super.changeActivity(VehicleActivity.Stand)
        }
    }

    update(elapsedMs: number) {
        super.update(elapsedMs)
        this.body.update(elapsedMs)
    }

    protected getNullJointForUpgrade(upgrade: AnimationEntityUpgrade): SceneMesh | undefined {
        return super.getNullJointForUpgrade(upgrade) ||
            this.body.animation.nullJoints.get(upgrade.upgradeNullName.toLowerCase())?.[upgrade.upgradeNullIndex]
    }

}
