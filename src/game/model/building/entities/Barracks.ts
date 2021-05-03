import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { SceneManager } from '../../../SceneManager'
import { WorldManager } from '../../../WorldManager'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class Barracks extends BuildingEntity {

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.BARRACKS, 'Buildings/Barracks/Barracks.ae')
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.Barracks
    }

}
