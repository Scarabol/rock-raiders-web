import { ResourceManager } from '../../../../resource/ResourceManager'
import { VehicleSceneEntity } from '../../../../scene/entities/VehicleSceneEntity'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { VehicleEntity } from '../VehicleEntity'

export class LargeMlp extends VehicleEntity {

    sceneEntity: VehicleSceneEntity

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.LARGE_MLP, )
        this.sceneEntity = new VehicleSceneEntity(sceneMgr, 'Vehicles/LMLP/LMLP.ae')
    }

    get stats() {
        return ResourceManager.stats.LargeMLP
    }

}
