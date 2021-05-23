import { Vector2 } from 'three'
import { BuildingEntityStats } from '../../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { BuildingEntity } from '../BuildingEntity'

export class Geodome extends BuildingEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.GEODOME, 'Buildings/Geo-dome/Geo-dome.ae')
        this.primaryPowerPath = null
        this.secondaryBuildingPart = new Vector2(0, 1)
    }

    get stats(): BuildingEntityStats {
        return ResourceManager.stats.Geodome
    }

}
