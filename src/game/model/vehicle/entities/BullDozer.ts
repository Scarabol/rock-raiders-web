import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { Job } from '../../job/Job'
import { RaiderTool } from '../../raider/RaiderTool'
import { VehicleEntity } from '../VehicleEntity'

export class BullDozer extends VehicleEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.BULLDOZER, 'Vehicles/Bulldozer/Bulldozer.ae')
    }

    isPrepared(job: Job): boolean {
        return job.getRequiredTool() === RaiderTool.SHOVEL
    }

    get stats() {
        return ResourceManager.stats.Bulldozer
    }

}
