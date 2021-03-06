import { AnimEntityActivity } from '../../game/model/activities/AnimEntityActivity'
import { AnimationEntityUpgrade } from '../../game/model/anim/AnimationEntityUpgrade'
import { SceneManager } from '../../game/SceneManager'
import { AnimatedSceneEntity } from '../AnimatedSceneEntity'
import { SceneMesh } from '../SceneMesh'
import { VehicleSceneEntity } from './VehicleSceneEntity'

export class WalkerDiggerSceneEntity extends VehicleSceneEntity {

    body: AnimatedSceneEntity = null

    constructor(sceneMgr: SceneManager) {
        super(sceneMgr, 'Vehicles/WalkerLegs/WalkerLegs.ae')
        this.body = new AnimatedSceneEntity(sceneMgr, 'Vehicles/WalkerBody/WalkerBody.ae')
        this.add(this.body.group)
    }

    changeActivity(activity: AnimEntityActivity = this.getDefaultActivity(), onAnimationDone: () => any = null, durationTimeMs: number = null) {
        if (this.body.activity === activity) return
        this.body.changeActivity(activity, onAnimationDone, durationTimeMs)
        super.changeActivity(activity)
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
