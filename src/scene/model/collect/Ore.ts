import { Building } from '../../../game/model/entity/building/Building'
import { PriorityIdentifier } from '../../../game/model/job/PriorityIdentifier'
import { LWOLoader } from '../../../resource/LWOLoader'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneManager } from '../../SceneManager'
import { CollectableEntity, CollectableType } from './CollectableEntity'

export class Ore extends CollectableEntity {

    constructor() {
        super()
        const resource = ResourceManager.getResource('MiscAnims/Ore/Ore1st.lwo')
        const mesh = SceneManager.registerMesh(new LWOLoader('MiscAnims/Ore/').parse(resource))
        this.group.add(mesh)
    }

    get stats() {
        return ResourceManager.stats.Ore
    }

    getTargetBuildingTypes(): Building[] {
        return [Building.ORE_REFINERY, Building.TOOLSTATION]
    }

    onDiscover() {
        super.onDiscover()
        console.log('Ore has been discovered')
    }

    getCollectableType(): CollectableType {
        return CollectableType.ORE
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityOre
    }

}
