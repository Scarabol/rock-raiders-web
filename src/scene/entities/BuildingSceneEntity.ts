import { AnimationActivity, AnimEntityActivity, BuildingActivity } from '../../game/model/anim/AnimationActivity'
import { SceneManager } from '../../game/SceneManager'
import { LegacyAnimatedSceneEntity } from '../LegacyAnimatedSceneEntity'

/**
 * @deprecated
 */
export class BuildingSceneEntity extends LegacyAnimatedSceneEntity {
    powered: boolean = false

    constructor(sceneMgr: SceneManager, aeFilename: string) {
        super(sceneMgr, aeFilename)
        this.flipXAxis()
    }

    setPowered(state: boolean) {
        if (this.powered === state) return
        this.powered = state
        this.changeActivity()
    }

    getDefaultActivity(): AnimationActivity {
        return !this.powered ? BuildingActivity.Unpowered : AnimEntityActivity.Stand
    }
}
