import { AnimEntityActivity } from '../../game/model/activities/AnimEntityActivity'
import { BuildingActivity } from '../../game/model/activities/BuildingActivity'
import { SceneManager } from '../../game/SceneManager'
import { AnimatedSceneEntity } from '../AnimatedSceneEntity'
import { SceneEntity } from '../SceneEntity'

export class BuildingSceneEntity extends AnimatedSceneEntity {

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

    getDefaultActivity(): BuildingActivity {
        return !this.powered ? BuildingActivity.Unpowered : AnimEntityActivity.Stand
    }

    pickupEntity(sceneEntity: SceneEntity) {
        this.animation.carryJoints.some((j) => {
            if (j.children.length < 1) {
                j.add(sceneEntity.group)
                sceneEntity.position.set(0, 0, 0)
                return true
            }
        })
    }

    dropEntity(sceneEntity: SceneEntity) {
        this.animation.carryJoints.forEach((j) => j.remove(sceneEntity.group))
    }
}
