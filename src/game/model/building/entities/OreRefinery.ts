import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { RaiderActivity } from '../../activities/RaiderActivity'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class OreRefinery extends BuildingEntity {

    constructor() {
        super(EntityType.ORE_REFINERY, 'Buildings/OreRefinery/OreRefinery.ae')
        this.secondaryBuildingPart = {x: 0, y: 1}
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.OreRefinery
    }

    getDropAction(): RaiderActivity {
        return RaiderActivity.Deposit
    }

}
