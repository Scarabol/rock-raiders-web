import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { SceneManager } from '../../../SceneManager'
import { WorldManager } from '../../../WorldManager'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class Toolstation extends BuildingEntity {

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.TOOLSTATION, 'Buildings/Toolstation/Toolstation.ae')
        this.blocksPathSurface = false
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.Toolstation
    }

}
