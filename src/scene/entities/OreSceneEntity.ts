import { SceneManager } from '../../game/SceneManager'
import { ResourceManager } from '../../resource/ResourceManager'
import { SceneEntity } from '../SceneEntity'

export class OreSceneEntity extends SceneEntity {

    constructor(sceneMgr: SceneManager) {
        super(sceneMgr)
        this.add(ResourceManager.getLwoModel('MiscAnims/Ore/Ore1st.lwo'))
    }

}
