import { AnimEntityActivity } from '../../game/model/activities/AnimEntityActivity'
import { BuildingActivity } from '../../game/model/activities/BuildingActivity'
import { SceneManager } from '../../game/SceneManager'
import { AnimatedSceneEntity } from '../AnimatedSceneEntity'
import { BubbleSprite } from '../BubbleSprite'
import { SceneEntity } from '../SceneEntity'

export class BuildingSceneEntity extends AnimatedSceneEntity {

    inBeam: boolean = false
    powered: boolean = false
    powerBubble: BubbleSprite = new BubbleSprite('Bubble_PowerOff')
    powerBubbleFlashTimer: number = 0

    constructor(sceneMgr: SceneManager, aeFilename: string) {
        super(sceneMgr, aeFilename)
        this.flipXAxis()
        this.add(this.powerBubble)
    }

    setInBeam(state: boolean) {
        this.inBeam = state
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

    update(elapsedMs: number) {
        super.update(elapsedMs)
        this.powerBubbleFlashTimer = (this.powerBubbleFlashTimer + elapsedMs) % 1000
        this.powerBubble.visible = !this.inBeam && !this.powered && this.powerBubbleFlashTimer < 500
    }

}
