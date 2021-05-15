import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { MaterialEntity } from './MaterialEntity'

export class Ore extends MaterialEntity {

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.ORE)
        this.group.add(ResourceManager.getLwoModel('MiscAnims/Ore/Ore1st.lwo'))
        this.targetBuildingTypes = [EntityType.ORE_REFINERY, EntityType.TOOLSTATION]
        this.priorityIdentifier = PriorityIdentifier.aiPriorityOre
    }

    get stats() {
        return ResourceManager.stats.Ore
    }

}
