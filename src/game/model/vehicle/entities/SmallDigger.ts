import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { VehicleEntity } from '../VehicleEntity'

export class SmallDigger extends VehicleEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.SMALL_DIGGER, 'Vehicles/SmallDigger/SmallDigger.ae')
    }

    get stats() {
        return ResourceManager.stats.SmallDigger
    }

}
