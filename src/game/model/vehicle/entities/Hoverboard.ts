import { ResourceManager } from '../../../../resource/ResourceManager'
import { SceneManager } from '../../../SceneManager'
import { WorldManager } from '../../../WorldManager'
import { RaiderActivity } from '../../activities/RaiderActivity'
import { EntityType } from '../../EntityType'
import { VehicleEntity } from '../VehicleEntity'

export class Hoverboard extends VehicleEntity {

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.HOVERBOARD, 'Vehicles/Hoverboard/Hoverboard.ae')
    }

    get stats() {
        return ResourceManager.stats.Hoverboard
    }

    getDriverActivity(): RaiderActivity {
        return RaiderActivity.Hoverboard
    }

}
