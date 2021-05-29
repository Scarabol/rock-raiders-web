import { ResourceManager } from '../../../resource/ResourceManager'
import { CrystalSceneEntity } from '../../../scene/entities/CrystalSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { MaterialEntity } from './MaterialEntity'

export class Crystal extends MaterialEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.CRYSTAL)
        this.sceneEntity = new CrystalSceneEntity(sceneMgr)
    }

    get stats() {
        return ResourceManager.stats.PowerCrystal
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityCrystal
    }

    getTargetBuildingTypes(): EntityType[] {
        return [EntityType.POWER_STATION, EntityType.TOOLSTATION]
    }

}
