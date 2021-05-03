import { LWOLoader } from '../../../resource/LWOLoader'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { MaterialEntity } from './MaterialEntity'

export class Ore extends MaterialEntity {

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.ORE)
        const resource = ResourceManager.getResource('MiscAnims/Ore/Ore1st.lwo')
        const mesh = SceneManager.registerMesh(new LWOLoader('MiscAnims/Ore/').parse(resource))
        this.group.add(mesh)
        this.targetBuildingTypes = [EntityType.ORE_REFINERY, EntityType.TOOLSTATION]
        this.priorityIdentifier = PriorityIdentifier.aiPriorityOre
    }

    get stats() {
        return ResourceManager.stats.Ore
    }

}
