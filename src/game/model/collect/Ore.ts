import { LWOLoader } from '../../../resource/LWOLoader'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { CollectableEntity } from './CollectableEntity'

export class Ore extends CollectableEntity {

    constructor() {
        super(EntityType.ORE)
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
