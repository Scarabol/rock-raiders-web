import { SceneManager } from '../../game/SceneManager'
import { ResourceManager } from '../../resource/ResourceManager'
import { SceneEntity } from '../SceneEntity'

export class ElectricFenceSceneEntity extends SceneEntity {

    constructor(sceneMgr: SceneManager) {
        super(sceneMgr)
        this.add(ResourceManager.getLwoModel('Buildings/E-Fence/E-Fence4.lwo'))
    }

}
