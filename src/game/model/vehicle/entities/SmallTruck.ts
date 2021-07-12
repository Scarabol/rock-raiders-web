import { ResourceManager } from '../../../../resource/ResourceManager'
import { VehicleSceneEntity } from '../../../../scene/entities/VehicleSceneEntity'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { VehicleEntity } from '../VehicleEntity'

export class SmallTruck extends VehicleEntity {

    sceneEntity: VehicleSceneEntity

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.SMALL_TRUCK)
        this.sceneEntity = new VehicleSceneEntity(sceneMgr, 'Vehicles/SmallTruck/SmallTruck.ae')
    }

    get stats() {
        return ResourceManager.stats.SmallTruck
    }

}
