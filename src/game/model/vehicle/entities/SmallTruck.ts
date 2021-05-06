import { ResourceManager } from '../../../../resource/ResourceManager'
import { SceneManager } from '../../../SceneManager'
import { WorldManager } from '../../../WorldManager'
import { RaiderActivity } from '../../activities/RaiderActivity'
import { EntityType } from '../../EntityType'
import { VehicleEntity } from '../VehicleEntity'

export class SmallTruck extends VehicleEntity {

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.SMALL_TRUCK, 'Vehicles/SmallTruck/SmallTruck.ae')
    }

    get stats() {
        return ResourceManager.stats.SmallTruck
    }

    getDriverActivity(): RaiderActivity {
        return RaiderActivity.SMALLTRUCK
    }

}
