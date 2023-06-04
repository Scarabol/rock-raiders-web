import { Group, Matrix4, Object3D } from 'three'
import { Updatable } from '../game/model/Updateable'
import { SceneMesh } from './SceneMesh'
import { AnimEntityData } from '../resource/AnimEntityParser'
import { ResourceManager } from '../resource/ResourceManager'
import { AnimEntityActivity } from '../game/model/anim/AnimationActivity'
import { AnimationGroup } from './AnimationGroup'
import { SceneEntity } from './SceneEntity'
import { DEV_MODE } from '../params'
import { AnimationQualityGroup } from './AnimationQualityGroup'

export class AnimatedSceneEntity extends Group implements Updatable {
    readonly animationData: AnimEntityData[] = []
    readonly animationGroups: AnimationGroup[] = []
    readonly meshesByLName: Map<string, SceneMesh[]> = new Map()
    readonly installedUpgrades: { parent: Object3D, child: AnimatedSceneEntity }[] = []
    readonly animationParent: Group = new Group()
    readonly carryJoints: SceneMesh[] = []
    readonly carriedByIndex: Map<number, SceneEntity> = new Map()
    upgradeLevel: string = '0000'
    currentAnimation: string
    driverParent: Object3D = null
    driver: Object3D = null

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
        if (this.driver !== driver) this.removeDriver()
        this.driver = driver
        this.driver.position.set(0, 0, 0)
        this.driver.rotation.set(0, 0, 0)
        this.driverParent?.add(this.driver)
    }

    removeDriver() {
        if (!this.driver) return
        this.driverParent?.remove(this.driver)
        this.driver.position.copy(this.driverParent.position)
        this.driver.rotation.copy(this.driverParent.rotation)
        this.driver = null
    }

    setAnimation(animationName: string, onAnimationDone?: () => unknown, durationTimeoutMs: number = 0) {
        if (this.currentAnimation === animationName) return
        this.currentAnimation = animationName
        if (this.animationData.length > 0) this.removeAll()
        this.driverParent = this.animationParent
        this.animationData.forEach((animEntityData) => {
            const animData = animEntityData.animations.find((a) => a.name.equalsIgnoreCase(animationName))
                ?? animEntityData.animations.find((a) => a.name.equalsIgnoreCase(AnimEntityActivity.Stand))
            const animatedGroup = new AnimationQualityGroup(animEntityData, animData, onAnimationDone, durationTimeoutMs).start()
            animatedGroup.meshList.forEach((m) => this.meshesByLName.getOrUpdate(m.name, () => []).add(m))
            this.animationParent.add(animatedGroup)
            this.animationGroups.push(animatedGroup)
            // add carry joints
            if (animEntityData.carryNullName) {
                this.carryJoints.push(...animatedGroup.meshList.filter((a) => animEntityData.carryNullName.equalsIgnoreCase(a.name)))
            }
            // add driver joints
            if (animEntityData.driverNullName) {
                this.driverParent = animatedGroup.meshList.find((mesh) => mesh.name.equalsIgnoreCase(animEntityData.driverNullName)) || this.driverParent
            }
            // add wheels
            if (animEntityData.wheelMesh && animEntityData.wheelNullName) {
                const wheelParentMesh = this.meshesByLName.getOrUpdate(animEntityData.wheelNullName, () => [])
                if (wheelParentMesh.length < 1) {
                    console.error(`Could not find wheel parent ${animEntityData.wheelNullName} in ${Array.from(this.meshesByLName.keys())}`)
                    return
                }
                wheelParentMesh.forEach((p) => p.add(ResourceManager.getLwoModel(animEntityData.wheelMesh)))
            }
        })
        if (this.driver) this.driverParent.add(this.driver)
        this.reinstallAllUpgrades()
        this.addCarriedToJoints()
    }

    private removeAll() {
        this.animationParent.clear()
        this.animationGroups.forEach((a) => a.dispose())
        this.animationGroups.length = 0
        this.meshesByLName.clear()
        this.installedUpgrades.forEach((e) => e.parent.remove(e.child))
        this.installedUpgrades.length = 0
        this.removeDriver()
        this.driverParent = null
        this.carryJoints.length = 0
    }

    setUpgradeLevel(upgradeLevel: string) {
        if (this.upgradeLevel === upgradeLevel) return
        this.upgradeLevel = upgradeLevel
        this.installedUpgrades.forEach((e) => e.parent.remove(e.child))
        this.installedUpgrades.length = 0
        this.reinstallAllUpgrades()
        this.addCarriedToJoints()
    }

    reinstallAllUpgrades() {
        this.animationData.forEach((animEntityData) => {
            const upgrades = animEntityData.upgradesByLevel.get(this.upgradeLevel) ?? animEntityData.upgradesByLevel.get('0000') ?? []
            upgrades.forEach((upgrade) => {
                const parent = this.meshesByLName.get(upgrade.parentNullName.toLowerCase())?.[upgrade.parentNullIndex]
                if (!parent) {
                    console.error(`Could not find upgrade parent for '${upgrade.lNameType}' with name '${upgrade.parentNullName}' in ${Array.from(this.meshesByLName.keys())}`)
                    return
                }
                const upgradeMesh = new AnimatedSceneEntity()
                upgradeMesh.name = upgrade.lNameType
                const upgradeFilename = ResourceManager.configuration.upgradeTypesCfg.get(upgrade.lNameType) || upgrade.lUpgradeFilepath
                console.log(`Upgrade filename ${upgradeFilename}`)
                try {
                    const upgradeAnimData = ResourceManager.getAnimatedData(upgradeFilename)
                    upgradeMesh.addAnimated(upgradeAnimData)
                } catch (e) {
                    if (!DEV_MODE) console.warn(e)
                    const mesh = ResourceManager.getLwoModel(upgradeFilename)
                    if (!mesh) {
                        console.error(`Could not get mesh for ${upgrade.lNameType}`)
                    } else {
                        upgradeMesh.animationParent.add(mesh)
                    }
                }
                upgradeMesh.upgradeLevel = this.upgradeLevel
                upgradeMesh.setAnimation(this.currentAnimation)
                parent.add(upgradeMesh)
                this.installedUpgrades.add({parent: parent, child: upgradeMesh})
            })
        })
    }

    update(elapsedMs: number) {
        this.animationGroups.forEach((a) => a.update(elapsedMs))
        this.meshesByLName.forEach((meshes) => meshes.forEach((m) => m.update(elapsedMs)))
        this.installedUpgrades.forEach((c) => c.child.update(elapsedMs))
    }

    private addCarriedToJoints() {
        this.carriedByIndex.forEach((item, index) => {
            const carryJoint = this.carryJoints[index]
            if (carryJoint) {
                carryJoint.add(item.group)
            } else {
                console.warn(`Could not find carry joint with index ${index} in ${this.carryJoints}`)
            }
        })
    }

    flipXAxis() {
        this.animationParent.applyMatrix4(new Matrix4().makeScale(-1, 1, 1))
    }

    pickupEntity(entity: SceneEntity) {
        const foundCarryJoint = this.carryJoints.some((carryJoint, index) => {
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
            const carryJoint = this.carryJoints[index]
            if (carryJoint) {
                carryJoint.remove(item.group)
                carryJoint.getWorldPosition(position)
            }
            item.position.copy(position)
        })
        this.carriedByIndex.clear()
        return dropped
    }

    dispose() {
        this.animationGroups.forEach((a) => a.dispose())
        this.animationGroups.length = 0
    }
}
