import { Group, Object3D, Vector2, Vector3 } from 'three'
import { SceneMesh } from './SceneMesh'
import { AnimEntityData } from '../resource/AnimEntityParser'
import { ResourceManager } from '../resource/ResourceManager'
import { AnimEntityActivity } from '../game/model/anim/AnimationActivity'
import { VERBOSE } from '../params'
import { AnimationQualityGroup } from './AnimationQualityGroup'
import { SceneManager } from '../game/SceneManager'
import { GameConfig } from '../cfg/GameConfig'
import { SceneEntity } from '../game/SceneEntity'

export class AnimatedSceneEntity extends SceneEntity {
    readonly animationData: AnimEntityData[] = []
    readonly cacheAnimationGroups: Map<string, AnimationQualityGroup> = new Map()
    readonly animationGroups: AnimationQualityGroup[] = []
    readonly meshesByLName: Map<string, SceneMesh[]> = new Map()
    readonly installedUpgrades: { parent: Object3D, child: AnimatedSceneEntity }[] = []
    readonly animationParent: Group = new Group()
    readonly carryJoints: SceneMesh[] = []
    readonly carriedByIndex: Map<number, Object3D> = new Map()
    readonly wheelJoints: { mesh: SceneMesh, radius: number }[] = []
    upgradeLevel: string = '0000'
    currentAnimation: string = ''
    driverParent?: Object3D
    driver?: Object3D
    toolParent?: Object3D
    depositParent?: Object3D
    xPivotObj?: Object3D
    pivotMinZ: number | undefined
    pivotMaxZ: number | undefined
    yPivotObj?: Object3D
    flipCamera: boolean = false
    camFPVJoint?: Object3D
    camShoulderJoint?: Object3D
    camFPVChildren: Object3D[] = []
    camShoulderChildren: Object3D[] = []

    constructor() {
        super()
        this.add(this.animationParent)
    }

    addAnimated(animatedData: AnimEntityData) {
        this.animationData.add(animatedData)
        this.animationParent.scale.setScalar(this.animationData.reduce((prev, b) => prev * (b.scale || 1), 1))
    }

    addDriver(driver: Object3D) {
        if (!this.driverParent) return
        this.driver = driver
        this.driver.position.set(0, 0, 0)
        this.driver.rotation.set(0, 0, 0)
        this.driverParent.add(this.driver)
    }

    removeDriver() {
        if (!this.driver) return
        this.driverParent?.remove(this.driver)
        this.driver.position.copy(this.driverParent?.position || this.position)
        this.driver.rotation.copy(this.driverParent?.rotation || this.rotation)
        this.driver = undefined
    }

    setAnimation(animationName: string, onAnimationDone?: () => void, durationTimeoutMs: number = 0, onAnimationTrigger?: () => void) {
        if (this.currentAnimation === animationName) return
        this.currentAnimation = animationName
        if (this.animationData.length > 0) this.removeAll()
        this.camFPVChildren = this.camFPVJoint?.children || this.camFPVChildren
        this.camShoulderChildren = this.camShoulderJoint?.children || this.camShoulderChildren
        this.animationData.forEach((animEntityData) => {
            const animData = animEntityData.animations.find((a) => a.name.equalsIgnoreCase(animationName))
                ?? animEntityData.animations.find((a) => a.name.equalsIgnoreCase(AnimEntityActivity.Stand))
            if (!animData) {
                console.error(`Animation data neither have "${animationName}" nor stand animation`)
                return
            }
            const animatedGroup = this.cacheAnimationGroups.getOrUpdate(animData.file, () => {
                return new AnimationQualityGroup(animEntityData, animData, onAnimationDone, durationTimeoutMs, onAnimationTrigger).setup()
            })
            animatedGroup.resetAnimation()
            animatedGroup.onAnimationDone = onAnimationDone
            animatedGroup.durationTimeoutMs = durationTimeoutMs
            animatedGroup.onAnimationTrigger = onAnimationTrigger
            animatedGroup.meshList.forEach((m) => this.meshesByLName.getOrUpdate(m.name, () => []).add(m))
            this.animationParent.add(animatedGroup)
            this.animationGroups.push(animatedGroup)
            this.pivotMaxZ = animEntityData.pivotMaxZ ?? this.pivotMaxZ
            this.pivotMinZ = animEntityData.pivotMinZ ?? this.pivotMinZ
            // add wheels
            if (animEntityData.wheelMesh && animEntityData.wheelNullName) {
                const wheelParentMesh = this.meshesByLName.getOrUpdate(animEntityData.wheelNullName, () => [])
                if (wheelParentMesh.length < 1) {
                    if (this.currentAnimation !== AnimEntityActivity.TeleportIn) {
                        console.warn(`Could not find wheel parent ${animEntityData.wheelNullName} in ${Array.from(this.meshesByLName.keys())}`)
                    }
                    return
                }
                wheelParentMesh.forEach((p) => {
                    const wheelMesh = ResourceManager.getLwoModel(animEntityData.wheelMesh)
                    if (!wheelMesh) {
                        console.warn(`Could not find wheel mesh "${animEntityData.wheelMesh}"`)
                    } else {
                        p.add(wheelMesh)
                        this.wheelJoints.add({mesh: wheelMesh, radius: animEntityData.wheelRadius})
                    }
                })
            }
        })
        this.finalizeMeshSetup()
        const camJoints = this.animationGroups.flatMap((a) => a.meshList.filter((m) => m.name.equalsIgnoreCase(a.animEntityData.cameraNullName)))
        this.camFPVJoint = camJoints[0]
        if (this.camFPVJoint) {
            this.camFPVJoint.rotation.y = this.flipCamera ? Math.PI : 0 // XXX Why is this needed for vehicles and not pilot?
            this.camFPVChildren.forEach((c) => this.camFPVJoint?.add(c))
        }
        this.camShoulderJoint = camJoints[1]
        if (this.camShoulderJoint) {
            this.camShoulderJoint.rotation.y = this.flipCamera ? Math.PI : 0 // XXX Why is this needed for vehicles and not pilot?
            this.camShoulderChildren.forEach((c) => this.camShoulderJoint?.add(c))
        }
    }

    setAnimationSpeed(multiplier: number) {
        this.animationGroups.forEach((a) => a.animationMixers.forEach((m) => m.timeScale = multiplier))
    }

    private removeAll() {
        this.animationParent.clear()
        this.animationGroups.length = 0
        this.meshesByLName.clear()
        this.installedUpgrades.forEach((e) => e.parent.remove(e.child))
        this.installedUpgrades.length = 0
        this.wheelJoints.forEach((w) => w.mesh.dispose())
        this.wheelJoints.length = 0
        this.carryJoints.length = 0
        if (this.driverParent && this.driver) this.driverParent.remove(this.driver)
        this.driverParent = undefined
        this.toolParent = undefined
        this.depositParent = undefined
        this.xPivotObj = undefined
        this.yPivotObj = undefined
    }

    setUpgradeLevel(upgradeLevel: string) {
        if (this.upgradeLevel === upgradeLevel) return
        this.upgradeLevel = upgradeLevel
        this.installedUpgrades.forEach((e) => e.parent.remove(e.child))
        this.installedUpgrades.length = 0
        this.finalizeMeshSetup()
    }

    private finalizeMeshSetup() {
        this.reinstallAllUpgrades()
        this.driverParent = this.animationParent
        this.animationData.forEach((animEntityData) => {
            if (animEntityData.carryNullName) this.carryJoints.push(...this.meshesByLName.getOrUpdate(animEntityData.carryNullName, () => []))
            if (animEntityData.driverNullName) this.driverParent = this.meshesByLName.get(animEntityData.driverNullName)?.last() || this.driverParent
            if (animEntityData.toolNullName) this.toolParent = this.meshesByLName.get(animEntityData.toolNullName)?.last() || this.toolParent
            if (animEntityData.depositNullName) this.depositParent = this.meshesByLName.get(animEntityData.depositNullName)?.last() || this.depositParent
            if (animEntityData.xPivotName) this.xPivotObj = this.meshesByLName.get(animEntityData.xPivotName)?.last() || this.xPivotObj
            if (animEntityData.yPivotName) this.yPivotObj = this.meshesByLName.get(animEntityData.yPivotName)?.last() || this.yPivotObj
        })
        this.addCarriedToJoints()
        if (this.driver) this.driverParent.add(this.driver)
    }

    reinstallAllUpgrades() {
        this.animationData.forEach((animEntityData) => {
            // XXX what if an upgrade level is not defined for an upgrade, but a compatible one is, like 0110 and 0100
            const upgrades = animEntityData.upgradesByLevel.get(this.upgradeLevel) ?? animEntityData.upgradesByLevel.get('0000') ?? []
            upgrades.forEach((upgrade) => {
                const parent = this.meshesByLName.get(upgrade.parentNullName.toLowerCase())?.[upgrade.parentNullIndex]
                if (!parent) {
                    if (this.currentAnimation !== AnimEntityActivity.TeleportIn) {
                        console.warn(`Could not find upgrade parent for '${upgrade.lNameType}' with name '${upgrade.parentNullName}' in animation '${this.currentAnimation}'`)
                    }
                    return
                }
                const upgradeMesh = new AnimatedSceneEntity()
                upgradeMesh.name = upgrade.lNameType
                const upgradeFilename = GameConfig.instance.upgradeTypesCfg.get(upgrade.lNameType) || upgrade.lUpgradeFilepath
                try {
                    const upgradeAnimData = ResourceManager.getAnimatedData(upgradeFilename)
                    upgradeMesh.addAnimated(upgradeAnimData)
                } catch (e) {
                    const mesh = ResourceManager.getLwoModel(upgradeFilename)
                    if (!mesh) {
                        console.error(`Could not get upgrade mesh for "${upgrade.lNameType}"`)
                    } else {
                        mesh.name = upgrade.lNameType
                        upgradeMesh.animationParent.add(mesh)
                        this.meshesByLName.getOrUpdate(mesh.name, () => []).push(mesh)
                    }
                }
                upgradeMesh.upgradeLevel = this.upgradeLevel
                upgradeMesh.setAnimation(this.currentAnimation)
                upgradeMesh.meshesByLName.forEach((mesh, lName) => this.meshesByLName.getOrUpdate(lName, () => []).push(...mesh))
                parent.add(upgradeMesh)
                this.installedUpgrades.add({parent: parent, child: upgradeMesh})
            })
        })
    }

    update(elapsedMs: number) {
        this.animationGroups.forEach((a) => a.update(elapsedMs))
        this.installedUpgrades.forEach((c) => c.child.update(elapsedMs))
    }

    private addCarriedToJoints() {
        this.carriedByIndex.forEach((item, index) => {
            const carryJoint = this.carryJoints[index]
            if (carryJoint) {
                carryJoint.add(item)
            } else {
                console.warn(`Could not find carry joint with index ${index} in ${this.carryJoints}`)
            }
        })
    }

    pickupEntity(entity: Object3D) {
        const foundCarryJoint = this.carryJoints.some((carryJoint, index) => {
            if (carryJoint.children.length < 1) {
                this.carriedByIndex.set(index, entity)
                carryJoint.add(entity)
                return true
            }
            return false
        })
        if (!foundCarryJoint) {
            if (VERBOSE) console.warn('Could not find empty carry joint to attach carried entity')
            this.carriedByIndex.set(this.carriedByIndex.size, entity) // rockies pick item before having a carry joint
        }
        entity.position.set(0, 0, 0)
    }

    removeAllCarried(): void {
        this.carriedByIndex.forEach((item, index) => {
            const carryJoint = this.carryJoints[index]
            const position = this.position.clone()
            if (carryJoint) {
                carryJoint.remove(item)
                carryJoint.getWorldPosition(position)
            }
            item.position.copy(position)
            item.rotation.copy(this.rotation)
        })
        this.carriedByIndex.clear()
    }

    dispose() {
        this.animationGroups.forEach((a) => a.dispose())
        this.animationGroups.length = 0
    }

    get heading(): number {
        return this.rotation.y
    }

    get position2D(): Vector2 {
        return new Vector2(this.position.x, this.position.z)
    }

    pointLaserAt(worldTarget: Vector3) {
        if (!worldTarget) return
        if (this.xPivotObj) {
            this.xPivotObj.rotation.order = 'YXZ'
            this.xPivotObj.rotation.set(0, 0, 0)
            const pivotWorldPos = this.xPivotObj.getWorldPosition(new Vector3())
            const diff = worldTarget.clone().sub(pivotWorldPos)
            const base = diff.clone().setY(0)
            let angleToTarget = base.angleTo(diff)
            if (diff.y > 0) angleToTarget *= -1
            // XXX use rotation speed and smooth movement
            this.xPivotObj.rotateX(this.limitAngle(angleToTarget))
        }
        const yPivot = this.yPivotObj ?? this.xPivotObj
        if (yPivot?.parent) {
            const pivotWorldPos = yPivot.getWorldPosition(new Vector3())
            const angleToTarget = Math.atan2(worldTarget.x - pivotWorldPos.x, worldTarget.z - pivotWorldPos.z)
            const parentDir = yPivot.parent.getWorldDirection(new Vector3())
            const parentAngle = new Vector2(parentDir.z, parentDir.x).angle()
            // XXX use rotation speed and smooth movement
            yPivot.rotation.y = angleToTarget - parentAngle
        }
    }

    private limitAngle(angle: number): number {
        let result = angle
        const min = this.pivotMinZ
        if (min !== null && min !== undefined && result < min) {
            result = min
        }
        const max = this.pivotMaxZ
        if (max !== null && max !== undefined && result > max) {
            result = max
        }
        return result
    }

    headTowards(location: Vector2) {
        this.lookAt(new Vector3(location.x, this.position.y, location.y))
    }

    addToScene(sceneMgr: SceneManager, worldPosition: Vector2 | undefined, headingRad: number | undefined) {
        if (worldPosition) {
            this.position.copy(sceneMgr.getFloorPosition(worldPosition))
        }
        if (headingRad !== undefined && headingRad !== null) {
            this.rotation.y = headingRad
        }
        this.visible = sceneMgr.terrain.getSurfaceFromWorld(this.position).discovered
        sceneMgr.addSceneEntity(this)
    }

    getFireNullParents(): { worldPos: Vector3, worldDirection: Vector3 }[] {
        return this.animationData.flatMap((a) => this.meshesByLName.getOrUpdate(a.fireNullName, () => []).map((parent) => {
            return {worldPos: parent.getWorldPosition(new Vector3()), worldDirection: parent.getWorldDirection(new Vector3())}
        }))
    }

    restartAnimation() {
        this.animationGroups.forEach((a) => a.resetAnimation())
    }
}
