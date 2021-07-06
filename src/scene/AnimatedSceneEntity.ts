import { AnimEntityActivity } from '../game/model/activities/AnimEntityActivity'
import { BaseActivity } from '../game/model/activities/BaseActivity'
import { AnimationEntityType } from '../game/model/anim/AnimationEntityType'
import { AnimClip } from '../game/model/anim/AnimClip'
import { SceneManager } from '../game/SceneManager'
import { ResourceManager } from '../resource/ResourceManager'
import { SceneEntity } from './SceneEntity'

export class AnimatedSceneEntity extends SceneEntity {

    animationEntityType: AnimationEntityType = null
    animation: AnimClip = null
    activity: BaseActivity = null

    constructor(sceneMgr: SceneManager, aeFilename: string) {
        super(sceneMgr)
        this.animationEntityType = ResourceManager.getAnimationEntityType(aeFilename, this.sceneMgr.listener)
    }

    removeFromScene() {
        super.removeFromScene()
        this.animation?.stop()
    }

    changeActivity(activity: AnimEntityActivity = this.getDefaultActivity(), onAnimationDone: () => any = null, durationTimeMs: number = null) {
        if (this.activity === activity || this.animationEntityType === null) return
        this.activity = activity
        const lActivityKey = activity.activityKey.toLowerCase()
        let animation = this.animationEntityType.animations.get(lActivityKey)
        if (!animation) { // find by prefix
            this.animationEntityType.animations.forEach((a, key) => {
                if (!animation && lActivityKey.startsWith(key)) animation = a
            })
        }
        if (!animation) {
            console.warn('Activity ' + activity.activityKey + ' unknown or has no animation defined')
            console.log(this.animationEntityType.animations)
            return
        }
        if (this.animation) {
            this.remove(this.animation.polyRootGroup)
            this.animation.stop()
        }
        const carriedChildren = this.animation?.carryJoint?.children
        if (carriedChildren && carriedChildren.length > 0 && animation.carryJoint) {
            animation.carryJoint.add(...carriedChildren) // keep carried children
        }
        this.animation = animation
        this.add(this.animation.polyRootGroup)
        this.animation.start(onAnimationDone, durationTimeMs)
    }

    update(elapsedMs: number) {
        super.update(elapsedMs)
        this.animation?.update(elapsedMs)
    }

}
