import { Vector2 } from 'three'
import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { RaiderActivity } from '../../activities/RaiderActivity'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class PowerStation extends BuildingEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.POWER_STATION, 'Buildings/Powerstation/Powerstation.ae')
        this.secondaryBuildingPart = new Vector2(-1, 0)
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.Powerstation
    }

    getDropAction(): RaiderActivity {
        return RaiderActivity.Deposit
    }

}
