import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { VehicleEntity } from '../VehicleEntity'

export class LargeMlp extends VehicleEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.LARGE_MLP, 'Vehicles/LMLP/LMLP.ae')
    }

    get stats() {
        return ResourceManager.stats.LargeMLP
    }

}
