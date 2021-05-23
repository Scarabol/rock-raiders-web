import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { RaiderActivity } from '../../activities/RaiderActivity'
import { EntityType } from '../../EntityType'
import { TerrainPath } from '../../map/TerrainPath'
import { PathTarget } from '../../PathTarget'
import { RaiderTraining } from '../../raider/RaiderTraining'
import { VehicleEntity } from '../VehicleEntity'

export class SmallHeli extends VehicleEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.SMALL_HELI, 'Vehicles/SmallHeli/SmallHeli.ae')
    }

    get stats() {
        return ResourceManager.stats.SmallHeli
    }

    getRequiredTraining(): RaiderTraining {
        return RaiderTraining.PILOT
    }

    getDriverActivity(): RaiderActivity {
        return RaiderActivity.SMALLheli
    }

    findPathToTarget(target: PathTarget): TerrainPath {
        return this.sceneMgr.terrain.findFlyPath(this.getPosition2D(), target)
    }

}
