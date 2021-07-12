import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { RaiderTraining } from '../../raider/RaiderTraining'
import { VehicleEntity } from '../VehicleEntity'

export class SmallCat extends VehicleEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.SMALL_CAT, 'Vehicles/SmallCat/SmallCat.ae')
    }

    get stats() {
        return ResourceManager.stats.SmallCat
    }

    getRequiredTraining(): RaiderTraining {
        return RaiderTraining.SAILOR
    }

}
