import { ResourceManager } from '../../../../resource/ResourceManager'
import { SceneManager } from '../../../SceneManager'
import { WorldManager } from '../../../WorldManager'
import { AnimEntityActivity } from '../../activities/AnimEntityActivity'
import { AnimationEntityType } from '../../anim/AnimationEntityType'
import { EntityType } from '../../EntityType'
import { VehicleActivity } from '../VehicleActivity'
import { VehicleEntity } from '../VehicleEntity'

export class WalkerDigger extends VehicleEntity {

    walkerLegs: AnimationEntityType

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.WALKER_DIGGER, 'Vehicles/WalkerBody/WalkerBody.ae')
        this.walkerLegs = ResourceManager.getAnimationEntityType('Vehicles/WalkerLegs/WalkerLegs.ae', sceneMgr.listener)
    }

    get stats() {
        return ResourceManager.stats.WalkerDigger
    }

    changeActivity(activity: AnimEntityActivity = this.getDefaultActivity(), onAnimationDone: () => any = null, durationTimeMs: number = null) {
        super.changeActivity(activity, onAnimationDone, durationTimeMs)
        // TODO set animation for legs too
        // TODO legs have activity stand which is not listed in the activities list
    }

    getDefaultActivity(): VehicleActivity {
        return VehicleActivity.Route
    }

}
