import { AnimationGroup } from './AnimationGroup'
import { SceneMesh } from './SceneMesh'
import { AnimationAction, AnimationClip, AnimationMixer, AnimationUtils, LoopOnce, LoopPingPong } from 'three'

export class AnimationLoopGroup extends AnimationGroup {
    readonly loopActions: AnimationAction[] = []
    readonly endActions: AnimationAction[] = []
    loopStart: number = 0
    loopEnd: number = 0
    looping: boolean = false
    playing: boolean = false

    setLoop(loopStart: number, loopEnd: number): this {
        this.loopStart = loopStart
        this.loopEnd = loopEnd
        return this
    }

    protected override addMixer(mesh: SceneMesh, clip: AnimationClip) {
        const fps = 25 // TODO get FPS from LWS
        const startFrame = Math.round(fps * this.loopStart)
        const endFrame = Math.round(fps * this.loopEnd)
        const lastFrame = Math.round(fps * clip.duration)

        const endMixer = new AnimationMixer(mesh)
        this.animationMixers.push(endMixer)
        const endClip = AnimationUtils.subclip(clip, 'clip.end', endFrame, lastFrame, fps)
        const endAction = endMixer.clipAction(endClip)
        this.endActions.push(endAction)
        endAction.setLoop(LoopOnce, 0)
        endAction.clampWhenFinished = true
        endMixer.addEventListener('finished', () => {
            if (this.onAnimationDone && !this.isDone && this.endActions.every((a) => !a.isRunning())) {
                this.isDone = true
                this.resetAnimation()
                this.onAnimationDone()
            }
        })

        const loopMixer = new AnimationMixer(mesh)
        this.animationMixers.push(loopMixer)
        const loopClip = AnimationUtils.subclip(clip, 'clip.loop', startFrame, endFrame, fps)
        const loopAction = loopMixer.clipAction(loopClip)
        this.loopActions.push(loopAction)
        loopAction.setLoop(LoopPingPong, Infinity)

        const startMixer = new AnimationMixer(mesh) // mixer needs to recreate after each group change
        this.animationMixers.push(startMixer)
        const startClip = AnimationUtils.subclip(clip, 'clip.start', 0, startFrame, fps)
        const startAction = startMixer.clipAction(startClip)
        this.animationActions.push(startAction)
        startAction.setLoop(LoopOnce, 0)
        startAction.clampWhenFinished = true
        startMixer.addEventListener('finished', () => {
            if (this.animationActions.every((a) => !a.isRunning())) {
                if (!this.looping) {
                    this.looping = true
                    this.loopActions.forEach((a) => a.play())
                }
            }
        })
    }

    interruptLoop() {
        if (this.looping) {
            this.loopActions.forEach((a) => a.stop())
            this.endActions.forEach((a) => a.play())
        } else if (this.playing) {
            this.animationMixers.forEach((m) => m.stopAllAction())
            this.endActions.forEach((a) => a.play())
        }
        this.looping = false
        this.playing = false
    }

    override play(): this {
        super.play()
        this.playing = true
        return this
    }

    override resetAnimation() {
        super.resetAnimation()
        this.looping = false
        this.playing = false
    }
}
