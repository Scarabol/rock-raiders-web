import { Matrix4, Vector2, Vector3 } from 'three'
import { AnimationActivity } from '../game/model/anim/AnimationActivity'
import { AnimationEntityType } from '../game/model/anim/AnimationEntityType'
import { AnimationEntityUpgrade } from '../game/model/anim/AnimationEntityUpgrade'
import { AnimClip } from '../game/model/anim/AnimClip'
import { SceneManager } from '../game/SceneManager'
import { AnimEntityLoader } from '../resource/AnimEntityLoader'
import { ResourceManager } from '../resource/ResourceManager'
import { SceneEntity } from './SceneEntity'
import { SceneMesh } from './SceneMesh'

export class AnimatedSceneEntity extends SceneEntity {
    readonly animationEntityType: AnimationEntityType = null
    readonly upgrades: SceneMesh[] = []
    readonly animatedUpgrades: AnimatedSceneEntity[] = []
    readonly bodiesByName: Map<string, SceneMesh> = new Map()
    readonly carriedByIndex: Map<number, SceneEntity> = new Map()
    animation: AnimClip = null
    activity: AnimationActivity = null

    constructor(sceneMgr: SceneManager, aeFilename: string) {
        super(sceneMgr)
        let cfgRoot = ResourceManager.getResource(aeFilename)
        if (!cfgRoot) throw new Error(`Could not get animation entity type for: ${aeFilename}`)
        this.animationEntityType = new AnimEntityLoader(aeFilename, cfgRoot, this.sceneMgr.audioListener).loadModels()
    }

    disposeFromScene() {
        super.disposeFromScene()
        this.animation?.stop()
    }

    update(elapsedMs: number) {
        super.update(elapsedMs)
        this.animation?.update(elapsedMs)
        this.upgrades.forEach((u) => u.update(elapsedMs))
    }

    getDefaultActivity(): AnimationActivity {
        return this.animationEntityType.firstAnimationName
    }

    changeActivity(activity: AnimationActivity = this.getDefaultActivity(), onAnimationDone: () => any = null, durationTimeMs: number = null) {
        if ((this.activity === activity || this.animationEntityType === null) && !!onAnimationDone === !!this.animation?.onAnimationDone) return
        this.activity = activity
        const lActivityKey = activity.toLowerCase()
        let animation = this.animationEntityType.animations.get(lActivityKey)
        if (!animation) {
            console.warn(`Activity ${activity} unknown or has no animation; Possible options are: ${Array.from(this.animationEntityType.animations.keys())}`)
            console.log(this.animationEntityType.animations)
            return
        }
        if (this.animation) {
            this.disposeUpgrades()
            this.removeFromMeshGroup(this.animation.polyRootGroup)
            this.animation.stop()
            this.bodiesByName.clear()
        }
        this.animation = animation
        this.animation.nullJoints.forEach((j, lName) => {
            if (lName) j.forEach((m) => this.bodiesByName.set(lName, m))
        })
        this.animation.polyList.forEach((m) => {
            if (m.name) this.bodiesByName.set(m.name, m)
        })
        this.applyDefaultUpgrades(activity)
        this.addToMeshGroup(this.animation.polyRootGroup)
        this.animation.start(onAnimationDone, durationTimeMs)
        this.addCarriedToJoints() // keep carried items
    }

    private disposeUpgrades() {
        this.upgrades.forEach((u) => {
            u.parent?.remove(u)
            u.dispose()
        })
        this.animatedUpgrades.forEach((u) => {
            u.group.parent?.remove(u.group)
        })
    }

    private applyDefaultUpgrades(activity: AnimationActivity) {
        const upgrades0000 = this.animationEntityType.upgradesByLevel.get('0000')
        if (upgrades0000) {
            upgrades0000.forEach((upgrade) => {
                const joint = this.getNullJointForUpgrade(upgrade)
                if (joint) {
                    const lwoModel = ResourceManager.getLwoModel(upgrade.upgradeFilepath)
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
                } else { // this may happen for some animations
                    // console.warn(`Could not find null joint ${upgrade.upgradeNullName} and index ${upgrade.upgradeNullIndex} to attach upgrade: ${upgrade.upgradeFilepath}`)
                }
            })
        }
    }

    protected getNullJointForUpgrade(upgrade: AnimationEntityUpgrade): SceneMesh | undefined {
        return this.animation.nullJoints.get(upgrade.upgradeNullName.toLowerCase())?.[upgrade.upgradeNullIndex]
    }

    private addCarriedToJoints() {
        this.carriedByIndex.forEach((item, index) => {
            const carryJoint = this.animation.carryJoints[index]
            if (carryJoint) {
                carryJoint.add(item.group)
            } else {
                console.warn(`Could not find carry joint with index ${index} in ${this.animation.carryJoints}`)
            }
        })
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
            const angle = diff.clone().setY(pivotWorldPos.y).angleTo(diff) / Math.PI - Math.PI / 20
            const lAngle = this.limitAngle(angle)
            xPivot.setRotationFromAxisAngle(new Vector3(1, 0, 0), lAngle) // XXX use rotation speed and smooth movement
        }
        const yPivot = this.bodiesByName.get(this.animationEntityType.yPivot?.toLowerCase())
        if (yPivot) {
            const pivotWorldPos = new Vector3()
            yPivot.getWorldPosition(pivotWorldPos)
            const angle = terrainIntersectionPoint.clone().sub(new Vector2(pivotWorldPos.x, pivotWorldPos.z)).angle() + Math.PI / 2
            yPivot.setRotationFromAxisAngle(new Vector3(0, 1, 0), angle) // XXX use rotation speed and smooth movement
        }
    }

    private limitAngle(angle: number): number {
        let result = angle
        const min = this.animationEntityType.PivotMinZ
        if (min !== null && min !== undefined && result < min) {
            result = min
        }
        const max = this.animationEntityType.PivotMaxZ
        if (max !== null && max !== undefined && result > max) {
            result = max
        }
        return result
    }

    pickupEntity(entity: SceneEntity) {
        const foundCarryJoint = this.animation.carryJoints.some((carryJoint, index) => {
            if (carryJoint.children.length < 1) {
                this.carriedByIndex.set(index, entity)
                carryJoint.add(entity.group)
                return true
            }
            return false
        })
        if (!foundCarryJoint) {
            console.warn('Could not find empty carry joint to attach carried entity')
        }
        entity.position.set(0, 0, 0)
    }

    dropAllEntities(): SceneEntity[] {
        const dropped = Array.from(this.carriedByIndex.values())
        const position = this.position.clone()
        this.carriedByIndex.forEach((item, index) => {
            const carryJoint = this.animation.carryJoints[index]
            if (carryJoint) {
                carryJoint.remove(item.group)
                carryJoint.getWorldPosition(position)
            }
            item.position.copy(position)
        })
        this.carriedByIndex.clear()
        return dropped
    }
}
