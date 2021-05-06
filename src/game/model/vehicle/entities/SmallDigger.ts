import { ResourceManager } from '../../../../resource/ResourceManager'
import { SceneManager } from '../../../SceneManager'
import { WorldManager } from '../../../WorldManager'
import { EntityType } from '../../EntityType'
import { VehicleEntity } from '../VehicleEntity'

export class SmallDigger extends VehicleEntity {

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.SMALL_DIGGER, 'Vehicles/SmallDigger/SmallDigger.ae')
    }

    get stats() {
        return ResourceManager.stats.SmallDigger
    }

}
