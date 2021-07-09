import { AnimEntityActivity } from '../../game/model/activities/AnimEntityActivity'
import { BuildingActivity } from '../../game/model/activities/BuildingActivity'
import { SceneManager } from '../../game/SceneManager'
import { AnimatedSceneEntity } from '../AnimatedSceneEntity'

export class BuildingSceneEntity extends AnimatedSceneEntity {

    powered: boolean = false

    constructor(sceneMgr: SceneManager, aeFilename: string) {
        super(sceneMgr, aeFilename)
        this.flipXAxis()
    }

    getDefaultActivity(): BuildingActivity {
        return !this.powered ? BuildingActivity.Unpowered : AnimEntityActivity.Stand
    }

}
