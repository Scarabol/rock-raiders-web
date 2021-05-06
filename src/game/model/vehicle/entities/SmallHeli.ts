import { ResourceManager } from '../../../../resource/ResourceManager'
import { SceneManager } from '../../../SceneManager'
import { WorldManager } from '../../../WorldManager'
import { RaiderActivity } from '../../activities/RaiderActivity'
import { EntityType } from '../../EntityType'
import { TerrainPath } from '../../map/TerrainPath'
import { PathTarget } from '../../PathTarget'
import { RaiderTraining } from '../../raider/RaiderTraining'
import { VehicleEntity } from '../VehicleEntity'

export class SmallHeli extends VehicleEntity {

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.SMALL_HELI, 'Vehicles/SmallHeli/SmallHeli.ae')
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
