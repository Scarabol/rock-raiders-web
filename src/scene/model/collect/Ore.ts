import { LWOLoader } from '../../../resource/LWOLoader'
import { ResourceManager } from '../../../resource/ResourceManager'
import { CollectableEntity, CollectableType } from './CollectableEntity'
import { Building } from '../../../game/model/entity/building/Building'
import { SceneManager } from '../../SceneManager'

export class Ore extends CollectableEntity {

    constructor() {
        super(CollectableType.ORE)
        const resource = ResourceManager.getResource('MiscAnims/Ore/Ore1st.lwo')
        const mesh = SceneManager.registerMesh(new LWOLoader('MiscAnims/Ore/').parse(resource))
        this.group.add(mesh)
    }

    getTargetBuildingTypes(): Building[] {
        return [Building.ORE_REFINERY, Building.TOOLSTATION]
    }

    onDiscover() {
        super.onDiscover()
        console.log('Ore has been discovered')
    }

}
