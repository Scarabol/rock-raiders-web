import { AnimationActivity, DynamiteActivity } from '../../game/model/anim/AnimationActivity'
import { SceneManager } from '../../game/SceneManager'
import { AnimatedSceneEntity } from '../AnimatedSceneEntity'

export class DynamiteSceneEntity extends AnimatedSceneEntity {
    constructor(sceneMgr: SceneManager) {
        super(sceneMgr, 'MiscAnims/Dynamite/Dynamite.ae')
        this.changeActivity()
    }

    getDefaultActivity(): AnimationActivity {
        return DynamiteActivity.Normal
    }
}
