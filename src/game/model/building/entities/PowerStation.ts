import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class PowerStation extends BuildingEntity {

    constructor() {
        super(EntityType.POWER_STATION, 'Buildings/Powerstation/Powerstation.ae')
        this.secondaryBuildingPart = {x: 1, y: 0}
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.Powerstation
    }

}
