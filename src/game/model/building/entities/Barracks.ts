import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class Barracks extends BuildingEntity {

    constructor() {
        super(EntityType.BARRACKS, 'Buildings/Barracks/Barracks.ae')
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.Barracks
    }

}
