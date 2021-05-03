import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { SceneManager } from '../../../SceneManager'
import { WorldManager } from '../../../WorldManager'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class Upgrade extends BuildingEntity {

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.UPGRADE, 'Buildings/Upgrade/Upgrade.ae')
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.Upgrade
    }

}
