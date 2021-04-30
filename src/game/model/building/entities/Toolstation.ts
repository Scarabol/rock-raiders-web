import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class Toolstation extends BuildingEntity {

    constructor() {
        super(EntityType.TOOLSTATION, 'Buildings/Toolstation/Toolstation.ae')
        this.blocksPathSurface = false
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.Toolstation
    }

}
