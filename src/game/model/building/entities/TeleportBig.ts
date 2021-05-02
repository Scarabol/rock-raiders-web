import { Vector2 } from 'three'
import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { SceneManager } from '../../../SceneManager'
import { WorldManager } from '../../../WorldManager'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class TeleportBig extends BuildingEntity {

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.TELEPORT_BIG, 'Buildings/BIGTeleport/BIGTeleport.ae')
        this.secondaryBuildingPart = new Vector2(1, 0)
        this.secondaryPowerPath = new Vector2(1, 1)
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.TeleportBIG
    }

}
