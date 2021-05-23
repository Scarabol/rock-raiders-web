import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { VehicleEntity } from '../VehicleEntity'

export class LargeDigger extends VehicleEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.LARGE_DIGGER, 'Vehicles/LargeDigger/LargeDigger.ae')
    }

    get stats() {
        return ResourceManager.stats.LargeDigger
    }

}
