import { AnimationAction, AnimationClip, AnimationMixer, AudioListener, Group, LoopOnce, NumberKeyframeTrack } from 'three'
import { Updatable } from '../game/model/Updateable'
import { ResourceManager } from '../resource/ResourceManager'
import { SceneMesh } from './SceneMesh'
import { getPath } from '../core/Util'
import { LWSCData } from '../resource/fileparser/LWSCParser'
import { SceneAudioMesh } from './SceneAudioMesh'

export class AnimationGroup extends Group implements Updatable {
    readonly meshList: SceneMesh[] = []
    readonly animationMixers: AnimationMixer[] = []
    readonly animationActions: AnimationAction[] = []
    isDone: boolean = false
    animationTransCoef: number = 1
    animationTime: number = 0
    maxDurationMs: number = 0
    animationTriggerTimeMs: number = 0

    constructor(readonly lwsFilepath: string, readonly onAnimationDone: () => void, readonly durationTimeoutMs: number = 0, readonly onAnimationTrigger: () => void = null) {
        super()
        this.maxDurationMs = durationTimeoutMs
        this.animationTriggerTimeMs = durationTimeoutMs
    }

    setup(audioListener: AudioListener): this {
        const lwscData = ResourceManager.getLwscData(this.lwsFilepath)
        this.createMeshList(lwscData, audioListener)
        this.createAnimationMixers(lwscData, this.lwsFilepath)
        this.update(0)
        return this
    }

    protected resolveMesh(lowerName: string): SceneMesh {
        if (!lowerName) return null
        return ResourceManager.getLwoModel(getPath(this.lwsFilepath) + lowerName)
    }

    private createMeshList(lwscData: LWSCData, audioListener: AudioListener) {
        this.meshList.length = 0
        lwscData.objects.forEach((obj) => {
            let mesh: SceneMesh
            if (obj.isNull) {
                if (obj.lowerName === 'sfx') {
                    mesh = new SceneAudioMesh(audioListener)
                } else {
                    mesh = new SceneMesh()
                }
            } else {
                mesh = this.resolveMesh(obj.lowerName) || new SceneMesh()
            }
            mesh.name = obj.lowerName
            mesh.castShadow = obj.castShadow
            mesh.receiveShadow = obj.receiveShadow
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
            const opacityTracks = obj.opacityTracks.flatMap((t) => mesh.getMaterials()
                .map((m, index) => new NumberKeyframeTrack(`.material[${index}].opacity`, t.times, t.values)))
            const clip = new AnimationClip(lwsFilepath, lwscData.durationSeconds, [...obj.keyframeTracks, ...opacityTracks])
            this.maxDurationMs = Math.max(this.maxDurationMs, clip.duration * 1000)
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
            this.animationActions.push(animationAction)
            this.animationMixers.push(mixer)
        })
    }

    update(elapsedMs: number) {
        this.animationMixers.forEach((m) => m.update(elapsedMs / 1000 * this.animationTransCoef))
        this.meshList.forEach((m) => m.update(elapsedMs))
        if (this.durationTimeoutMs || this.animationTriggerTimeMs) { // otherwise animationTime counter may become very high for loop
            if (this.onAnimationTrigger && this.animationTime < this.animationTriggerTimeMs && this.animationTime + elapsedMs >= this.animationTriggerTimeMs) {
                this.onAnimationTrigger()
            }
            this.animationTime += elapsedMs
            if (this.durationTimeoutMs && this.animationTime >= this.durationTimeoutMs) {
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

    stop() {
        this.isDone = false
        this.animationTime = 0
        this.animationActions.forEach((m) => m.stop())
        // play needs to be called here to not have the animation stuck on last frame but first
        this.animationActions.forEach((m) => m.play())
        this.update(0)
    }
}
