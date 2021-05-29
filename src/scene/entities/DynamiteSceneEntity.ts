import { AnimEntityActivity } from '../../game/model/activities/AnimEntityActivity'
import { DynamiteActivity } from '../../game/model/activities/DynamiteActivity'
import { SceneManager } from '../../game/SceneManager'
import { AnimatedSceneEntity } from '../AnimatedSceneEntity'

export class DynamiteSceneEntity extends AnimatedSceneEntity {

    constructor(sceneMgr: SceneManager) {
        super(sceneMgr, 'MiscAnims/Dynamite/Dynamite.ae')
        this.changeActivity()
    }

    getDefaultActivity(): AnimEntityActivity {
        return DynamiteActivity.Normal
    }

}
