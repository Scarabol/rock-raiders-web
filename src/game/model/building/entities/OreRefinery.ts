import { Vector2 } from 'three'
import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { RaiderActivity } from '../../activities/RaiderActivity'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class OreRefinery extends BuildingEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.ORE_REFINERY, 'Buildings/OreRefinery/OreRefinery.ae')
        this.primaryPowerPath = new Vector2(0, 2)
        this.secondaryBuildingPart = new Vector2(0, 1)
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.OreRefinery
    }

    getDropAction(): RaiderActivity {
        return RaiderActivity.Deposit
    }

}
