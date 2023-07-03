import { AnimationClip, AnimationMixer, Group, LoopOnce } from 'three'
import { Updatable } from '../game/model/Updateable'
import { ResourceManager } from '../resource/ResourceManager'
import { SceneMesh } from './SceneMesh'
import { getPath } from '../core/Util'
import { LWSCData } from '../resource/LWSCParser'
import { VERBOSE } from '../params'

export class AnimationGroup extends Group implements Updatable {
    readonly meshList: SceneMesh[] = []
    readonly animationMixers: AnimationMixer[] = []
    isDone: boolean = false
    animationTransCoef: number = 1
    animationTime: number = 0

    constructor(readonly lwsFilepath: string, readonly onAnimationDone: () => unknown, readonly durationTimeoutMs: number = 0) {
        super()
    }

    start(): this {
        const lwscData = ResourceManager.getLwscData(this.lwsFilepath)
        this.createMeshList(lwscData)
        this.createAnimationMixers(lwscData, this.lwsFilepath)
        this.update(0)
        return this
    }

    protected resolveMesh(lowerName: string): SceneMesh {
        try {
            return ResourceManager.getLwoModel(getPath(this.lwsFilepath) + lowerName)
        } catch (e) {
            if (VERBOSE) console.warn(e)
            return new SceneMesh()
        }
    }

    private createMeshList(lwscData: LWSCData) {
        this.meshList.length = 0
        lwscData.objects.forEach((obj) => {
            let mesh: SceneMesh
            if (obj.isNull) {
                mesh = new SceneMesh()
            } else {
                mesh = this.resolveMesh(obj.lowerName)
            }
            mesh.name = obj.lowerName
            this.meshList.push(mesh)
        })
    }

    private createAnimationMixers(lwscData: LWSCData, lwsFilepath: string) {
        this.animationMixers.length = 0
        lwscData.objects.forEach((obj, index) => {
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
            if (this.onAnimationDone && !this.durationTimeoutMs) {
                animationAction.setLoop(LoopOnce, 0)
                animationAction.clampWhenFinished = true
                mixer.addEventListener('finished', () => {
                    if (!this.isDone) {
                        this.isDone = true
                        this.onAnimationDone()
                    }
                })
            }
            animationAction.play()
            this.animationMixers.push(mixer)
        })
    }

    update(elapsedMs: number) {
        this.animationMixers.forEach((m) => m.update(elapsedMs / 1000 * this.animationTransCoef))
        if (this.durationTimeoutMs) {
            this.animationTime += elapsedMs
            if (this.animationTime >= this.durationTimeoutMs) {
                this.animationMixers.forEach((a) => a.stopAllAction())
                if (this.onAnimationDone) {
                    this.onAnimationDone() // XXX ensure this is not triggered more than once
                }
            }
        }
    }

    dispose() {
        this.meshList.forEach((m) => m.dispose())
    }
}
