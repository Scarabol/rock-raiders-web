import { ResourceManager } from '../../../../resource/ResourceManager'
import { VehicleSceneEntity } from '../../../../scene/entities/VehicleSceneEntity'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { Job } from '../../job/Job'
import { RaiderTool } from '../../raider/RaiderTool'
import { VehicleEntity } from '../VehicleEntity'

export class BullDozer extends VehicleEntity {

    // FIXME entity moving funny while clearing

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.BULLDOZER)
        this.sceneEntity = new VehicleSceneEntity(sceneMgr, 'Vehicles/Bulldozer/Bulldozer.ae')
    }

    isPrepared(job: Job): boolean {
        return job.getRequiredTool() === RaiderTool.SHOVEL // FIXME vehicles: check for max carry and accept carry jobs too
    }

    get stats() {
        return ResourceManager.stats.Bulldozer
    }

}
