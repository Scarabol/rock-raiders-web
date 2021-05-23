import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { BuildingActivity } from '../../activities/BuildingActivity'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class GunStation extends BuildingEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.GUNSTATION, 'Buildings/gunstation/gunstation.ae')
        this.primaryPowerPath = null
    }

    getDefaultActivity(): BuildingActivity {
        return BuildingActivity.Stand
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.GunStation
    }

}
