import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class Geodome extends BuildingEntity {

    constructor() {
        super(EntityType.GEODOME, 'Buildings/Geo-dome/Geo-dome.ae')
        this.primaryPowerPath = null
        this.secondaryBuildingPart = {x: 0, y: 1}
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.Geodome
    }

}
