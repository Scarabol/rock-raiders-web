import { ResourceManager } from '../../../../resource/ResourceManager'
import { VehicleSceneEntity } from '../../../../scene/entities/VehicleSceneEntity'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { Job } from '../../job/Job'
import { VehicleEntity } from '../VehicleEntity'

export class SmallTruck extends VehicleEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.SMALL_TRUCK)
        this.sceneEntity = new VehicleSceneEntity(sceneMgr, 'Vehicles/SmallTruck/SmallTruck.ae')
    }

    get stats() {
        return ResourceManager.stats.SmallTruck
    }

    isPrepared(job: Job): boolean {
        const carryType = job.getCarryItem()?.entityType
        return carryType && (carryType === EntityType.ORE || carryType === EntityType.CRYSTAL || carryType === EntityType.ELECTRIC_FENCE)
    }

}
