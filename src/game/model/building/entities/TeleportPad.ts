import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'
import { SmallTeleport } from '../Teleport'

export class TeleportPad extends BuildingEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.TELEPORT_PAD, 'Buildings/Teleports/Teleports.ae')
        this.teleport = new SmallTeleport(this)
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.TeleportPad
    }

}
