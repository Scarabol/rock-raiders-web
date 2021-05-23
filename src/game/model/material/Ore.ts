import { ResourceManager } from '../../../resource/ResourceManager'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { MaterialEntity } from './MaterialEntity'

export class Ore extends MaterialEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.ORE)
        this.sceneEntity.add(ResourceManager.getLwoModel('MiscAnims/Ore/Ore1st.lwo'))
        this.targetBuildingTypes = [EntityType.ORE_REFINERY, EntityType.TOOLSTATION]
        this.priorityIdentifier = PriorityIdentifier.aiPriorityOre
    }

    get stats() {
        return ResourceManager.stats.Ore
    }

}
