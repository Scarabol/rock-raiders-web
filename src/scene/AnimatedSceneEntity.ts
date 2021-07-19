import { Matrix4, Vector2, Vector3 } from 'three'
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
    bodiesByName: Map<string, SceneMesh> = new Map()

    constructor(sceneMgr: SceneManager, aeFilename: string) {
        super(sceneMgr)
        this.animationEntityType = ResourceManager.getAnimationEntityType(aeFilename, this.sceneMgr.listener)
    }

    removeFromScene() {
        super.removeFromScene()
        this.animation?.stop()
    }

    changeActivity(activity: AnimEntityActivity = this.getDefaultActivity(), onAnimationDone: () => any = null, durationTimeMs: number = null) {
        if ((this.activity === activity || this.animationEntityType === null) && !!onAnimationDone === !!this.animation?.onAnimationDone) return
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
            this.bodiesByName.clear()
        }
        this.animation = animation
        this.animation.nullJoints.forEach((j, lName) => { // FIXME vehicles: using this name is super hacky
            if (lName) j.forEach((m) => this.bodiesByName.set(lName, m))
        })
        this.animation.polyList.forEach((m) => {
            if (m.name) this.bodiesByName.set(m.name, m) // FIXME vehicles: using this name is super hacky
        })
        this.applyDefaultUpgrades(activity)
        this.add(this.animation.polyRootGroup)
        this.animation.start(onAnimationDone, durationTimeMs)
    }

    private disposeUpgrades() { // FIXME vehicles: create each mesh/upgrade/animation only once and re-use it
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
        if (upgrades0000) { // FIXME vehicles: check for other upgrade levels
            upgrades0000.forEach((upgrade) => { // FIXME vehicles: parse upgrades only once
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
                        animatedUpgrade.bodiesByName.forEach((mesh, name) => {
                            this.bodiesByName.set(name, mesh)
                        })
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

    pointLaserAt(terrainIntersectionPoint: Vector2) {
        if (!terrainIntersectionPoint) return
        const xPivot = this.bodiesByName.get(this.animationEntityType.xPivot?.toLowerCase())
        if (xPivot) {
            const pivotWorldPos = new Vector3()
            xPivot.getWorldPosition(pivotWorldPos)
            const worldTarget = this.sceneMgr.getFloorPosition(terrainIntersectionPoint).setY(0)
            const diff = worldTarget.sub(pivotWorldPos)
            const angle = diff.clone().setY(pivotWorldPos.y).angleTo(diff) / Math.PI - Math.PI / 20 // TODO Does not compute!
            const lAngle = angle > this.animationEntityType.PivotMaxZ ? this.animationEntityType.PivotMaxZ : (angle < this.animationEntityType.PivotMinZ ? this.animationEntityType.PivotMinZ : angle) // FIXME vehicles: only limit angle if value is not null/undefined
            xPivot.setRotationFromAxisAngle(new Vector3(1, 0, 0), lAngle) // XXX use rotation speed and smooth movement
        }
        const yPivot = this.bodiesByName.get(this.animationEntityType.yPivot?.toLowerCase())
        if (yPivot) {
            const pivotWorldPos = new Vector3()
            yPivot.getWorldPosition(pivotWorldPos)
            const angle = terrainIntersectionPoint.clone().sub(new Vector2(pivotWorldPos.x, pivotWorldPos.z)).angle() + Math.PI / 2
            yPivot.setRotationFromAxisAngle(new Vector3(0, 1, 0), angle) // XXX use rotation speed and smooth movement
            // FIXME vehicles: limit by PivotMax???
        }
    }

}
