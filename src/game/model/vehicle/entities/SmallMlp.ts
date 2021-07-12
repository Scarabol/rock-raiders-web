import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { VehicleEntity } from '../VehicleEntity'

export class SmallMlp extends VehicleEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.SMALL_MLP, 'Vehicles/SMLP/SMLP.ae')
    }

    get stats() {
        return ResourceManager.stats.Smallmlp
    }

}
