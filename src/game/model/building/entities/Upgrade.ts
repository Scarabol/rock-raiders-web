import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class Upgrade extends BuildingEntity {

    constructor() {
        super(EntityType.UPGRADE, 'Buildings/Upgrade/Upgrade.ae')
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.Upgrade
    }

}
