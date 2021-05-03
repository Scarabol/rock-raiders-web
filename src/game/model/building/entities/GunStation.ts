import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { SceneManager } from '../../../SceneManager'
import { WorldManager } from '../../../WorldManager'
import { BuildingActivity } from '../../activities/BuildingActivity'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class GunStation extends BuildingEntity {

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.GUNSTATION, 'Buildings/gunstation/gunstation.ae')
        this.primaryPowerPath = null
    }

    getDefaultActivity(): BuildingActivity {
        return BuildingActivity.Stand
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.GunStation
    }

}
