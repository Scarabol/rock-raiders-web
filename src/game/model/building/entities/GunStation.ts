import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { BuildingActivity } from '../../activities/BuildingActivity'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class GunStation extends BuildingEntity {

    constructor() {
        super(EntityType.GUNSTATION, 'Buildings/gunstation/gunstation.ae')
        this.hasPrimaryPowerPath = false
    }

    getDefaultActivity(): BuildingActivity {
        return BuildingActivity.Stand
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.GunStation
    }

}
