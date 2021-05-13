import { Vector2 } from 'three'
import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { SceneManager } from '../../../SceneManager'
import { WorldManager } from '../../../WorldManager'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class Docks extends BuildingEntity {

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.DOCKS, 'Buildings/Docks/Docks.ae')
        this.primaryPowerPath = new Vector2(0, -1)
        this.waterPathSurface = new Vector2(0, 1)
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.Docks
    }

}
