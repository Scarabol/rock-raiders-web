import { ResourceManager } from '../../../../resource/ResourceManager'
import { WalkerDiggerSceneEntity } from '../../../../scene/entities/WalkerDiggerSceneEntity'
import { EntityManager } from '../../../EntityManager'
import { SceneManager } from '../../../SceneManager'
import { EntityType } from '../../EntityType'
import { Job } from '../../job/Job'
import { RaiderTool } from '../../raider/RaiderTool'
import { VehicleEntity } from '../VehicleEntity'

export class WalkerDigger extends VehicleEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.WALKER_DIGGER)
        this.sceneEntity = new WalkerDiggerSceneEntity(sceneMgr)
    }

    isPrepared(job: Job): boolean {
        return job.getRequiredTool() === RaiderTool.DRILL
    }

    get stats() {
        return ResourceManager.stats.WalkerDigger
    }

}
