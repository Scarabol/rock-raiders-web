import { AnimationAction, AnimationClip, AnimationMixer, LoopOnce, NumberKeyframeTrack } from 'three'
import { ResourceManager } from '../resource/ResourceManager'
import { SceneMesh } from './SceneMesh'
import { getPath } from '../core/Util'
import { LWSCData } from '../resource/fileparser/LWSCParser'
import { SceneAudioMesh } from './SceneAudioMesh'
import { SceneEntity } from '../game/SceneEntity'

export class AnimationGroup extends SceneEntity {
    readonly meshList: SceneMesh[] = []
    readonly animationMixers: AnimationMixer[] = []
    readonly animationActions: AnimationAction[] = []
    isDone: boolean = false
    animationTransCoef: number = 1
    animationTime: number = 0
    maxDurationMs: number = 0
    animationTriggerTimeMs: number = 0

    constructor(readonly lwsFilepath: string, public onAnimationDone: (() => void) | undefined, public durationTimeoutMs: number = 0, public onAnimationTrigger?: () => void) {
        super()
        this.maxDurationMs = durationTimeoutMs
        this.animationTriggerTimeMs = durationTimeoutMs
    }

    setup(): this {
        const lwscData = ResourceManager.getLwscData(this.lwsFilepath)
        this.createMeshList(lwscData)
        this.createAnimationMixers(lwscData)
        return this
    }

    protected resolveMesh(lowerName: string | undefined): SceneMesh | undefined {
        if (!lowerName) return undefined
        return ResourceManager.getLwoModel(getPath(this.lwsFilepath) + lowerName)
    }

    protected createMeshList(lwscData: LWSCData) {
        this.meshList.length = 0
        lwscData.objects.forEach((obj) => {
            let mesh: SceneMesh | undefined
            if (obj.isNull) {
                if (obj.lowerName === 'sfx' || obj.lowerName === 'snd') {
                    mesh = new SceneAudioMesh()
                } else {
                    mesh = new SceneMesh()
                }
            } else {
                mesh = this.resolveMesh(obj.lowerName)
                if (!mesh) {
                    console.warn(`Could not find mesh ${obj.lowerName}`)
                    mesh = new SceneMesh()
                }
            }
            mesh.name = obj.lowerName
            mesh.castShadow = obj.castShadow
            mesh.receiveShadow = obj.receiveShadow
            this.meshList.push(mesh)
        })
    }

    protected createAnimationMixers(lwscData: LWSCData) {
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
                .map((_, index) => new NumberKeyframeTrack(`.material[${index}].opacity`, t.times, t.values)))
            const clip = new AnimationClip(lwscData.filePath, lwscData.durationSeconds, [...obj.keyframeTracks, ...opacityTracks])
            this.maxDurationMs = Math.max(this.maxDurationMs, clip.duration * 1000)
            this.addMixer(mesh, clip)
        })
    }

    protected addMixer(mesh: SceneMesh, clip: AnimationClip) {
        const mixer = new AnimationMixer(mesh) // mixer needs to recreate after each group change
        this.animationMixers.push(mixer)
        const animationAction = mixer.clipAction(clip)
        this.animationActions.push(animationAction)
        if (this.onAnimationDone && !this.durationTimeoutMs) {
            animationAction.setLoop(LoopOnce, 0)
            animationAction.clampWhenFinished = true
            mixer.addEventListener('finished', () => {
                if (this.onAnimationDone && !this.isDone) {
                    this.isDone = true
                    this.onAnimationDone()
                }
            })
        }
    }

    update(elapsedMs: number) {
        const deltaTimeInSeconds = elapsedMs / 1000 * this.animationTransCoef
        this.animationMixers.forEach((m) => m.update(deltaTimeInSeconds))
        this.meshList.forEach((m) => m.update(elapsedMs))
        if (this.durationTimeoutMs || this.animationTriggerTimeMs) { // otherwise animationTime counter may become very high for loop
            if (this.onAnimationTrigger && this.animationTime < this.animationTriggerTimeMs && this.animationTime + elapsedMs >= this.animationTriggerTimeMs) {
                this.onAnimationTrigger()
            }
            this.animationTime += elapsedMs
            if (this.durationTimeoutMs && this.animationTime >= this.durationTimeoutMs) {
                this.animationMixers.forEach((a) => a.stopAllAction())
                if (this.onAnimationDone && !this.isDone) {
                    this.isDone = true
                    this.onAnimationDone()
                }
            }
        }
    }

    dispose() {
        this.meshList.forEach((m) => m.dispose())
    }

    play(): this {
        this.animationActions.forEach((a) => a.play())
        this.update(0)
        return this
    }

    resetAnimation() {
        this.isDone = false
        this.animationTime = 0
        this.animationMixers.forEach((m) => m.stopAllAction())
        // play needs to be called here to not have the animation stuck on last frame but first
        this.play()
    }
}
