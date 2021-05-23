import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class Toolstation extends BuildingEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.TOOLSTATION, 'Buildings/Toolstation/Toolstation.ae')
        this.blocksPathSurface = false
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.Toolstation
    }

}
