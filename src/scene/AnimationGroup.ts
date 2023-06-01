import { AnimationClip, AnimationMixer, Group, LoopOnce, Vector3 } from 'three'
import { Updatable } from '../game/model/Updateable'
import { ResourceManager } from '../resource/ResourceManager'
import { SceneMesh } from './SceneMesh'
import { getPath } from '../core/Util'
import { LWSCData } from '../resource/LWSCParser'

export class AnimationGroup extends Group implements Updatable {
    readonly animationMixers: AnimationMixer[] = []
    readonly meshList: SceneMesh[] = []

    constructor(lwsFilepath: string, position: Vector3, heading: number, readonly onAnimationDone: () => unknown) {
        super()
        this.position.copy(position)
        this.rotateOnAxis(new Vector3(0, 1, 0), heading)
        const lwscData = ResourceManager.getLwscData(lwsFilepath)
        this.meshList = this.createMeshList(lwscData, getPath(lwsFilepath))
        this.animationMixers = this.createAnimationMixers(lwscData, lwsFilepath)
    }

    private createAnimationMixers(lwscData: LWSCData, animationName: string) {
        return lwscData.objects.map((obj, index) => {
            const mesh = this.meshList[index]
            // associate child meshes with parents
            if (obj.parentObjInd === 0) { // index is 1 based, 0 means no parent
                this.add(mesh)
            } else {
                this.meshList[obj.parentObjInd - 1].add(mesh)
            }
            // setup animation clip for each object
            const clip = new AnimationClip(animationName, lwscData.durationSeconds, obj.keyframeTracks)
            const mixer = new AnimationMixer(mesh) // mixer needs to recreate after each group change
            const animationAction = mixer.clipAction(clip)
            animationAction.setLoop(LoopOnce, 0)
            animationAction.clampWhenFinished = true
            mixer.addEventListener('finished', () => {this.onAnimationDone()})
            animationAction.play()
            return mixer
        })
    }

    private createMeshList(lwscData: LWSCData, path: string) {
        return lwscData.objects.map((obj) => {
            let mesh: SceneMesh
            if (obj.isNull) {
                mesh = new SceneMesh()
            } else {
                mesh = ResourceManager.getLwoModel(path + obj.lowerName)
            }
            mesh.name = obj.lowerName
            return mesh
        })
    }

    update(elapsedMs: number) {
        this.animationMixers.forEach((m) => m.update(elapsedMs / 1000))
    }

    dispose() {
        this.meshList.forEach((m) => m.dispose())
    }
}
