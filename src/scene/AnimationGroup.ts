import { AnimationClip, AnimationMixer, Group, LoopOnce } from 'three'
import { Updatable } from '../game/model/Updateable'
import { ResourceManager } from '../resource/ResourceManager'
import { SceneMesh } from './SceneMesh'
import { getPath } from '../core/Util'
import { LWSCData } from '../resource/LWSCParser'

export class AnimationGroup extends Group implements Updatable {
    readonly meshList: SceneMesh[] = []
    readonly animationMixers: AnimationMixer[] = []

    constructor(lwsFilepath: string, readonly onAnimationDone: () => unknown) {
        super()
        const lwscData = ResourceManager.getLwscData(lwsFilepath)
        this.meshList = this.createMeshList(lwscData, getPath(lwsFilepath))
        this.animationMixers = this.createAnimationMixers(lwscData, lwsFilepath)
        this.update(0)
    }

    private createMeshList(lwscData: LWSCData, lwsFilepath: string) {
        return lwscData.objects.map((obj) => {
            let mesh: SceneMesh
            if (obj.isNull) {
                mesh = new SceneMesh()
            } else {
                mesh = ResourceManager.getLwoModel(getPath(lwsFilepath) + obj.lowerName)
            }
            mesh.name = obj.lowerName
            return mesh
        })
    }

    private createAnimationMixers(lwscData: LWSCData, lwsFilepath: string) {
        return lwscData.objects.map((obj, index) => {
            const mesh = this.meshList[index]
            // associate child meshes with parents
            if (obj.parentObjInd === 0) { // index is 1 based, 0 means no parent
                this.add(mesh)
            } else {
                this.meshList[obj.parentObjInd - 1].add(mesh)
            }
            // setup animation clip for each object
            const clip = new AnimationClip(lwsFilepath, lwscData.durationSeconds, obj.keyframeTracks)
            const mixer = new AnimationMixer(mesh) // mixer needs to recreate after each group change
            const animationAction = mixer.clipAction(clip)
            if (this.onAnimationDone) {
                animationAction.setLoop(LoopOnce, 0)
                animationAction.clampWhenFinished = true
                mixer.addEventListener('finished', () => {
                    this.onAnimationDone()
                })
            }
            animationAction.play()
            return mixer
        })
    }

    update(elapsedMs: number) {
        this.animationMixers.forEach((m) => m.update(elapsedMs / 1000))
    }

    dispose() {
        this.meshList.forEach((m) => m.dispose())
    }
}
