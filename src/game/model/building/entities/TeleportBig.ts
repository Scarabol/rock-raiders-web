import { Vector2 } from 'three'
import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'
import { LargeTeleport } from '../Teleport'

export class TeleportBig extends BuildingEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.TELEPORT_BIG, 'Buildings/BIGTeleport/BIGTeleport.ae')
        this.secondaryBuildingPart = new Vector2(0, 1)
        this.primaryPowerPath = new Vector2(-1, 0)
        this.secondaryPowerPath = new Vector2(-1, 1)
        this.teleport = new LargeTeleport(this)
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.TeleportBIG
    }

}
