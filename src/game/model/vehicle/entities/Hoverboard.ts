import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { RaiderActivity } from '../../activities/RaiderActivity'
import { EntityType } from '../../EntityType'
import { VehicleActivity } from '../VehicleActivity'
import { VehicleEntity } from '../VehicleEntity'

export class Hoverboard extends VehicleEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.HOVERBOARD, 'Vehicles/Hoverboard/Hoverboard.ae')
    }

    get stats() {
        return ResourceManager.stats.Hoverboard
    }

    getDriverActivity(): RaiderActivity {
        return this.sceneEntity.activity === VehicleActivity.Stand ? RaiderActivity.Standhoverboard : RaiderActivity.Hoverboard
    }

}
