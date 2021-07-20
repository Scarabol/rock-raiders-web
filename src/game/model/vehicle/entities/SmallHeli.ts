import { ResourceManager } from '../../../../resource/ResourceManager'
import { VehicleSceneEntity } from '../../../../scene/entities/VehicleSceneEntity'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { RaiderTraining } from '../../raider/RaiderTraining'
import { VehicleEntity } from '../VehicleEntity'

export class SmallHeli extends VehicleEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.SMALL_HELI)
        this.sceneEntity = new VehicleSceneEntity(sceneMgr, 'Vehicles/SmallHeli/SmallHeli.ae')
    }

    get stats() {
        return ResourceManager.stats.SmallHeli
    }

    getRequiredTraining(): RaiderTraining {
        return RaiderTraining.PILOT
    }

}
