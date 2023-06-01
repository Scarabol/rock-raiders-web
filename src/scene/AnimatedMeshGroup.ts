import { AnimationClip, AnimationMixer, Group, LoopOnce, Object3D } from 'three'
import { Updatable } from '../game/model/Updateable'
import { SceneMesh } from './SceneMesh'
import { AnimEntityData } from '../resource/AnimEntityParser'
import { ResourceManager } from '../resource/ResourceManager'
import { getPath } from '../core/Util'
import { AnimEntityActivity } from '../game/model/anim/AnimationActivity'

export class AnimatedMeshGroup extends Group implements Updatable {
    readonly animationData: AnimEntityData[] = []
    readonly animationMixers: AnimationMixer[] = []
    readonly meshesByLName: Map<string, SceneMesh[]> = new Map()
    readonly installedUpgrades: { parent: Object3D, child: AnimatedMeshGroup }[] = []
    readonly animationParent: Group = new Group()
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

    removeAll() {
        this.animationParent.clear()
        this.animationMixers.length = 0
        this.meshesByLName.clear()
        this.installedUpgrades.forEach((e) => e.parent.remove(e.child))
        this.installedUpgrades.length = 0
        this.removeDriver()
        this.driverParent = null
    }

    setAnimation(animationName: string, onAnimationDone?: () => unknown) {
        if (this.currentAnimation === animationName) return
        this.currentAnimation = animationName
        if (this.animationData.length > 0) this.removeAll()
        this.driverParent = this.animationParent
        this.animationData.forEach((animEntityData) => {
            const animData = animEntityData.animations.find((a) => a.name.equalsIgnoreCase(animationName))
                ?? animEntityData.animations.find((a) => a.name.equalsIgnoreCase(AnimEntityActivity.Stand))
            const lwscData = ResourceManager.getLwscData(animData.file)
            const meshList = lwscData.objects.map((obj) => {
                let mesh: SceneMesh
                if (obj.isNull) {
                    mesh = new SceneMesh()
                } else {
                    mesh = ResourceManager.getLwoModel(getPath(animData.file) + obj.lowerName)
                }
                mesh.name = obj.lowerName
                const meshes = this.meshesByLName.getOrUpdate(mesh.name.toLowerCase(), () => [])
                meshes.add(mesh)
                if (mesh.name.equalsIgnoreCase(animEntityData.driverNullName)) this.driverParent = mesh
                return mesh
            })
            // associate child meshes with parents
            lwscData.objects.forEach((obj, index) => {
                const mesh = meshList[index]
                if (obj.parentObjInd === 0) { // index is 1 based, 0 means no parent
                    this.animationParent.add(mesh)
                } else {
                    meshList[obj.parentObjInd - 1].add(mesh)
                }
                // setup animation clip
                const clip = new AnimationClip(animData.name, lwscData.durationSeconds, obj.keyframeTracks)
                const mixer = new AnimationMixer(mesh) // mixer needs to recreate after each group change
                const animationAction = mixer.clipAction(clip)
                if (onAnimationDone) {
                    mixer.addEventListener('finished', () => onAnimationDone())
                    animationAction.setLoop(LoopOnce, 0)
                    animationAction.clampWhenFinished = true
                }
                animationAction.play()
                this.animationMixers.push(mixer)
            })
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
    }

    setUpgradeLevel(upgradeLevel: string) {
        if (this.upgradeLevel === upgradeLevel) return
        this.upgradeLevel = upgradeLevel
        this.installedUpgrades.forEach((e) => e.parent.remove(e.child))
        this.installedUpgrades.length = 0
        this.reinstallAllUpgrades()
    }

    reinstallAllUpgrades() {
        this.animationData.forEach((animEntityData) => {
            const upgrades = animEntityData.upgradesByLevel.get(this.upgradeLevel) ?? animEntityData.upgradesByLevel.get('0000') ?? []
            upgrades.forEach((upgrade) => {
                const parent = this.meshesByLName.get(upgrade.parentNullName.toLowerCase())?.[upgrade.parentNullIndex]
                if (!parent) {
                    console.error(`Could not find upgrade parent for '${upgrade.lNameType}' with name '${upgrade.parentNullName}'`)
                    return
                }
                const upgradeMesh = new AnimatedMeshGroup()
                upgradeMesh.name = upgrade.lNameType
                const upgradeFilename = ResourceManager.configuration.upgradeTypesCfg.get(upgrade.lNameType) || upgrade.lNameType
                try {
                    const upgradeAnimData = ResourceManager.getAnimatedData(upgradeFilename)
                    upgradeMesh.addAnimated(upgradeAnimData)
                } catch (e) {
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
        this.update(0)
    }

    update(elapsedMs: number) {
        this.animationMixers.forEach((m) => m.update(elapsedMs / 1000))
        this.meshesByLName.forEach((meshes) => meshes.forEach((m) => m.update(elapsedMs)))
        this.installedUpgrades.forEach((c) => c.child.update(elapsedMs))
    }
}
