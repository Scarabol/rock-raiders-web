import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { RaiderActivity } from '../../activities/RaiderActivity'
import { EntityType } from '../../EntityType'
import { RaiderTraining } from '../../raider/RaiderTraining'
import { VehicleActivity } from '../VehicleActivity'
import { VehicleEntity } from '../VehicleEntity'

export class SmallHeli extends VehicleEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.SMALL_HELI, 'Vehicles/SmallHeli/SmallHeli.ae')
    }

    get stats() {
        return ResourceManager.stats.SmallHeli
    }

    getRequiredTraining(): RaiderTraining {
        return RaiderTraining.PILOT
    }

    getDriverActivity(): RaiderActivity {
        return this.sceneEntity.activity === VehicleActivity.Stand ? RaiderActivity.StandSMALLheli : RaiderActivity.SMALLheli
    }

}
