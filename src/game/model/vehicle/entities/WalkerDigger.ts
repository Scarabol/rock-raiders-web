import { ResourceManager } from '../../../../resource/ResourceManager'
import { WalkerDiggerSceneEntity } from '../../../../scene/entities/WalkerDiggerSceneEntity'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { VehicleEntity } from '../VehicleEntity'

export class WalkerDigger extends VehicleEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.WALKER_DIGGER, 'Vehicles/WalkerBody/WalkerBody.ae')
        this.sceneEntity = new WalkerDiggerSceneEntity(sceneMgr)
        this.sceneEntity.flipXAxis()
    }

    get stats() {
        return ResourceManager.stats.WalkerDigger
    }

}
