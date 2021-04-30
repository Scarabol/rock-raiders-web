import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class TeleportPad extends BuildingEntity {

    constructor() {
        super(EntityType.TELEPORT_PAD, 'Buildings/Teleports/Teleports.ae')
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.TeleportPad
    }

}
