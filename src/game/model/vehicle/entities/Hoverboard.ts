import { ResourceManager } from '../../../../resource/ResourceManager'
import { VehicleSceneEntity } from '../../../../scene/entities/VehicleSceneEntity'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { VehicleEntity } from '../VehicleEntity'

export class Hoverboard extends VehicleEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.HOVERBOARD)
        this.sceneEntity = new VehicleSceneEntity(sceneMgr, 'Vehicles/Hoverboard/Hoverboard.ae')
    }

    get stats() {
        return ResourceManager.stats.Hoverboard
    }

}
