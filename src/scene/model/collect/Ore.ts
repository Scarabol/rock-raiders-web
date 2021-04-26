import { Building } from '../../../game/model/entity/building/Building'
import { PriorityIdentifier } from '../../../game/model/job/PriorityIdentifier'
import { LWOLoader } from '../../../resource/LWOLoader'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneManager } from '../../SceneManager'
import { CollectableEntity } from './CollectableEntity'
import { CollectableType } from './CollectableType'

export class Ore extends CollectableEntity {

    constructor() {
        super(CollectableType.ORE)
        const resource = ResourceManager.getResource('MiscAnims/Ore/Ore1st.lwo')
        const mesh = SceneManager.registerMesh(new LWOLoader('MiscAnims/Ore/').parse(resource))
        this.group.add(mesh)
        this.targetBuildingTypes = [Building.ORE_REFINERY, Building.TOOLSTATION]
        this.priorityIdentifier = PriorityIdentifier.aiPriorityOre
    }

    get stats() {
        return ResourceManager.stats.Ore
    }

}
