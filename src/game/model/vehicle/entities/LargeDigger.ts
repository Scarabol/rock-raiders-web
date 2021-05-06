import { ResourceManager } from '../../../../resource/ResourceManager'
import { SceneManager } from '../../../SceneManager'
import { WorldManager } from '../../../WorldManager'
import { EntityType } from '../../EntityType'
import { VehicleEntity } from '../VehicleEntity'

export class LargeDigger extends VehicleEntity {

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.LARGE_DIGGER, 'Vehicles/LargeDigger/LargeDigger.ae')
    }

    get stats() {
        return ResourceManager.stats.LargeDigger
    }

}
