import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class Docks extends BuildingEntity {

    constructor() {
        super(EntityType.DOCKS, 'Buildings/Docks/Docks.ae')
        this.waterPathSurface = {x: 0, y: 1}
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.Docks
    }

}
