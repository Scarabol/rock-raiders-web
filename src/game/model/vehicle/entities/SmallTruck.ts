import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { VehicleEntity } from '../VehicleEntity'

export class SmallTruck extends VehicleEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.SMALL_TRUCK, 'Vehicles/SmallTruck/SmallTruck.ae')
    }

    get stats() {
        return ResourceManager.stats.SmallTruck
    }

}
