import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { TerrainPath } from '../../map/TerrainPath'
import { PathTarget } from '../../PathTarget'
import { RaiderTraining } from '../../raider/RaiderTraining'
import { VehicleEntity } from '../VehicleEntity'

export class LargeCat extends VehicleEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.LARGE_CAT, 'Vehicles/LargeCat/LargeCat.ae')
    }

    get stats() {
        return ResourceManager.stats.LargeCat
    }

    getRequiredTraining(): RaiderTraining {
        return RaiderTraining.SAILOR
    }

    findPathToTarget(target: PathTarget): TerrainPath {
        return this.sceneMgr.terrain.findSwimPath(this.sceneEntity.position2D.clone(), target)
    }

}
