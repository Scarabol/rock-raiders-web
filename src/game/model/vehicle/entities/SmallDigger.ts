import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { Job } from '../../job/Job'
import { RaiderTool } from '../../raider/RaiderTool'
import { VehicleEntity } from '../VehicleEntity'

export class SmallDigger extends VehicleEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.SMALL_DIGGER, 'Vehicles/SmallDigger/SmallDigger.ae')
    }

    isPrepared(job: Job): boolean {
        return job.getRequiredTool() === RaiderTool.DRILL
    }

    get stats() {
        return ResourceManager.stats.SmallDigger
    }

}
