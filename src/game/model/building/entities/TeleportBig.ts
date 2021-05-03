import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { SceneManager } from '../../../SceneManager'
import { WorldManager } from '../../../WorldManager'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class TeleportBig extends BuildingEntity {

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.TELEPORT_BIG, 'Buildings/BIGTeleport/BIGTeleport.ae')
        this.secondaryBuildingPart = {x: 1, y: 0}
        this.secondaryPowerPath = {x: 1, y: 1}
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.TeleportBIG
    }

}
