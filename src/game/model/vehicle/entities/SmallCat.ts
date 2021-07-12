import { ResourceManager } from '../../../../resource/ResourceManager'
import { VehicleSceneEntity } from '../../../../scene/entities/VehicleSceneEntity'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { RaiderTraining } from '../../raider/RaiderTraining'
import { VehicleEntity } from '../VehicleEntity'

export class SmallCat extends VehicleEntity {

    sceneEntity: VehicleSceneEntity

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.SMALL_CAT)
        this.sceneEntity = new VehicleSceneEntity(sceneMgr, 'Vehicles/SmallCat/SmallCat.ae')
    }

    get stats() {
        return ResourceManager.stats.SmallCat
    }

    getRequiredTraining(): RaiderTraining {
        return RaiderTraining.SAILOR
    }

}
