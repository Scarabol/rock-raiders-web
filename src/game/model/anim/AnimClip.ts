import { Group, PositionalAudio } from 'three'
import { SceneMesh } from '../../../scene/SceneMesh'
import { SequenceTextureMaterial } from '../../../scene/SequenceTextureMaterial'
import { updateSafe } from '../Updateable'
import { AnimSubObj } from './AnimSubObj'

export class AnimClip {

    looping: boolean = false
    transcoef: number = 1
    firstFrame: number = null
    lastFrame: number = null
    framesPerSecond: number = null
    bodies: AnimSubObj[] = []
    polyList: SceneMesh[] = []
    carryJoint: SceneMesh = null
    depositJoint: SceneMesh = null
    getToolJoint: SceneMesh = null
    wheelJoints: SceneMesh[] = []
    drillJoint: SceneMesh = null
    driverJoint: SceneMesh = null
    nullJoints: Map<string, SceneMesh[]> = new Map()
    polyModel: Group = new Group()
    sfxAudioByFrame: Map<number, PositionalAudio[]> = new Map()

    timer: number = 0
    currentFrame: number = null
    onAnimationDone: () => any = null
    durationTimeMs: number = null

    start(onAnimationDone: () => any, durationTimeMs: number) {
        this.timer = 0
        this.currentFrame = this.firstFrame
        this.onAnimationDone = onAnimationDone
        this.durationTimeMs = durationTimeMs
        this.updateBodiesAnimationFrame()
    }

    update(elapsedMs: number) {
        this.polyList.forEach((m) => updateSafe(m, elapsedMs))
        this.timer += elapsedMs
        const msPerFrame = 1000 / this.framesPerSecond * (this.transcoef || 1)
        const skippedFrames = Math.floor(this.timer / msPerFrame)
        this.timer -= skippedFrames * msPerFrame
        if (skippedFrames === 0) return
        let nextFrame = this.currentFrame + skippedFrames
        if (nextFrame <= this.lastFrame || !this.onAnimationDone || (this.durationTimeMs !== null && this.durationTimeMs > 0)) {
            if (nextFrame > this.lastFrame) nextFrame = this.firstFrame
            if (this.currentFrame === nextFrame) return
            this.currentFrame = nextFrame
            if (this.durationTimeMs !== null) this.durationTimeMs -= elapsedMs
            this.updateBodiesAnimationFrame()
        } else if (this.onAnimationDone) {
            this.stopAudio()
            this.onAnimationDone()
        }
    }

    private updateBodiesAnimationFrame() {
        if (this.polyList.length !== this.bodies.length) throw new Error('Cannot animate poly. Length differs from bodies length')
        this.bodies.forEach((body: AnimSubObj, index) => {
            const p = this.polyList[index]
            p.position.copy(body.relPos[this.currentFrame]).sub(body.pivot)
            p.rotation.copy(body.relRot[this.currentFrame])
            p.scale.copy(body.relScale[this.currentFrame])
            if (p.hasOwnProperty('material')) {
                const material = p['material']
                const opacity = body.opacity[this.currentFrame]
                if (material && opacity !== undefined) {
                    const matArr = Array.isArray(material) ? material : [material]
                    matArr.forEach((mat: SequenceTextureMaterial) => mat.setOpacity(opacity))
                }
            }
        })
        this.playAudio()
    }

    stop() {
        this.stopAudio()
    }

    private playAudio() {
        this.sfxAudioByFrame.getOrUpdate(this.currentFrame, () => []).forEach((a) => {
            if (a.isPlaying) a.stop()
            a.play()
        })
    }

    private stopAudio() {
        this.sfxAudioByFrame.forEach((f) => f.forEach((a) => a.isPlaying && a.stop()))
    }

}
