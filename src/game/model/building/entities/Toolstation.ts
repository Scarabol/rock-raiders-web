import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'
import { RaiderOnlyTeleport } from '../Teleport'

export class Toolstation extends BuildingEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.TOOLSTATION, 'Buildings/Toolstation/Toolstation.ae')
        this.teleport = new RaiderOnlyTeleport(this)
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.Toolstation
    }

}
