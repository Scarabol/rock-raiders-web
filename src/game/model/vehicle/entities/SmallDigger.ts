import { ResourceManager } from '../../../../resource/ResourceManager'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { RaiderActivity } from '../../activities/RaiderActivity'
import { EntityType } from '../../EntityType'
import { Job } from '../../job/Job'
import { RaiderTool } from '../../raider/RaiderTool'
import { VehicleActivity } from '../VehicleActivity'
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

    getDriverActivity(): RaiderActivity {
        return this.sceneEntity.activity === VehicleActivity.Stand ? RaiderActivity.StandSMALLDIGGER : RaiderActivity.SMALLDIGGER
    }

}
