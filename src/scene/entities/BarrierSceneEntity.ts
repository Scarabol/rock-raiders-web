import { BarrierActivity } from '../../game/model/activities/BarrierActivity'
import { SceneManager } from '../../game/SceneManager'
import { AnimatedSceneEntity } from '../AnimatedSceneEntity'

export class BarrierSceneEntity extends AnimatedSceneEntity {

    constructor(sceneMgr: SceneManager) {
        super(sceneMgr, 'MiscAnims/Barrier/Barrier.ae')
        this.changeActivity()
    }

    getDefaultActivity(): BarrierActivity {
        return BarrierActivity.Short
    }

}
