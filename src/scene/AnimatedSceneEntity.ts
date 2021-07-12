import { Matrix4 } from 'three'
import { AnimEntityActivity } from '../game/model/activities/AnimEntityActivity'
import { BaseActivity } from '../game/model/activities/BaseActivity'
import { AnimationEntityType } from '../game/model/anim/AnimationEntityType'
import { AnimationEntityUpgrade } from '../game/model/anim/AnimationEntityUpgrade'
import { AnimClip } from '../game/model/anim/AnimClip'
import { SceneManager } from '../game/SceneManager'
import { ResourceManager } from '../resource/ResourceManager'
import { SceneEntity } from './SceneEntity'
import { SceneMesh } from './SceneMesh'

export class AnimatedSceneEntity extends SceneEntity {

    animationEntityType: AnimationEntityType = null
    animation: AnimClip = null
    activity: BaseActivity = null
    upgrades: SceneMesh[] = []
    animatedUpgrades: AnimatedSceneEntity[] = []

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
        if (!animation) { // fallback to stand
            animation = this.animationEntityType.animations.get(AnimEntityActivity.Stand.activityKey.toLowerCase())
        }
        if (!animation) {
            console.warn(`Activity ${activity.activityKey} unknown or has no animation defined`)
            console.log(this.animationEntityType.animations)
            return
        }
        if (this.animation) {
            this.disposeUpgrades()
            this.remove(this.animation.polyRootGroup)
            this.animation.stop()
        }
        const carriedChildren = this.animation?.carryJoint?.children
        if (carriedChildren && carriedChildren.length > 0 && animation.carryJoint) {
            animation.carryJoint.add(...carriedChildren) // keep carried children
        }
        const driver = this.animation?.driverJoint.children
        if (driver && driver.length > 0) {
            animation.driverJoint.add(...driver) // keep driver
        }
        this.animation = animation
        this.applyDefaultUpgrades(activity)
        this.add(this.animation.polyRootGroup)
        this.animation.start(onAnimationDone, durationTimeMs)
    }

    private disposeUpgrades() { // TODO create each mesh/upgrade/animation only once and re-use it
        this.upgrades.forEach((u) => {
            u.parent?.remove(u)
            u.dispose()
        })
        this.animatedUpgrades.forEach((u) => {
            u.group.parent?.remove(u.group)
        })
    }

    update(elapsedMs: number) {
        super.update(elapsedMs)
        this.animation?.update(elapsedMs)
        this.upgrades.forEach((u) => u.update(elapsedMs))
    }

    private applyDefaultUpgrades(activity: AnimEntityActivity) {
        const upgrades0000 = this.animationEntityType.upgradesByLevel.get('0000')
        if (upgrades0000) { // TODO check for other upgrade levels
            upgrades0000.forEach((upgrade) => { // TODO parse upgrades only once
                const joint = this.getNullJointForUpgrade(upgrade)
                if (joint) {
                    const lwoModel = ResourceManager.getLwoModel(`${upgrade.upgradeFilepath}.lwo`)
                    if (lwoModel) {
                        joint.add(lwoModel)
                        this.upgrades.push(lwoModel)
                    } else {
                        const animatedUpgrade = new AnimatedSceneEntity(this.sceneMgr, `${upgrade.upgradeFilepath}/${upgrade.upgradeFilepath.split('/').last()}.ae`)
                        animatedUpgrade.changeActivity(activity)
                        joint.add(animatedUpgrade.group)
                        this.animatedUpgrades.push(animatedUpgrade)
                    }
                } else {
                    console.warn(`Could not find null joint ${upgrade.upgradeNullName} and index ${upgrade.upgradeNullIndex} to attach upgrade: ${upgrade.upgradeFilepath}`)
                }
            })
        }
    }

    protected getNullJointForUpgrade(upgrade: AnimationEntityUpgrade): SceneMesh | undefined {
        return this.animation.nullJoints.get(upgrade.upgradeNullName.toLowerCase())?.[upgrade.upgradeNullIndex]
    }

    flipXAxis() {
        this.group.applyMatrix4(new Matrix4().makeScale(-1, 1, 1))
    }

}
