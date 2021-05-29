import { ResourceManager } from '../../../resource/ResourceManager'
import { OreSceneEntity } from '../../../scene/entities/OreSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { MaterialEntity } from './MaterialEntity'

export class Ore extends MaterialEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.ORE)
        this.sceneEntity = new OreSceneEntity(sceneMgr)
    }

    get stats() {
        return ResourceManager.stats.Ore
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityOre
    }

    getTargetBuildingTypes(): EntityType[] {
        return [EntityType.ORE_REFINERY, EntityType.TOOLSTATION]
    }

}
