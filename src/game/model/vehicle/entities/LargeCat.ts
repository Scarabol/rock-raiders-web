import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { RaiderActivity } from '../../activities/RaiderActivity'
import { EntityType } from '../../EntityType'
import { RaiderTraining } from '../../raider/RaiderTraining'
import { VehicleActivity } from '../VehicleActivity'
import { VehicleEntity } from '../VehicleEntity'

export class LargeCat extends VehicleEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.LARGE_CAT, 'Vehicles/LargeCat/LargeCat.ae')
    }

    get stats() {
        return ResourceManager.stats.LargeCat
    }

    getRequiredTraining(): RaiderTraining {
        return RaiderTraining.SAILOR
    }

    getDriverActivity(): RaiderActivity {
        return this.sceneEntity.activity === VehicleActivity.Stand ? RaiderActivity.StandLARGECAT : RaiderActivity.LARGECAT
    }

}
