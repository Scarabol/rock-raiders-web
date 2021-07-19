import { Group, PositionalAudio } from 'three'
import { SceneMesh } from '../../../scene/SceneMesh'
import { updateSafe } from '../Updateable'
import { AnimSubObj } from './AnimSubObj'

export class AnimClip {

    lwsFilepath: string = null
    looping: boolean = false
    transcoef: number = 1
    firstFrame: number = null
    lastFrame: number = null
    framesPerSecond: number = null
    animatedPolys: AnimSubObj[] = []
    polyList: SceneMesh[] = []
    carryJoints: SceneMesh[] = []
    depositJoint: SceneMesh = null
    getToolJoint: SceneMesh = null
    wheelJoints: SceneMesh[] = []
    drillJoints: SceneMesh[] = []
    driverJoint: SceneMesh = null
    nullJoints: Map<string, SceneMesh[]> = new Map()
    xPivot: SceneMesh = null
    yPivot: SceneMesh = null
    polyRootGroup: Group = new Group()
    sfxAudioByFrame: Map<number, PositionalAudio[]> = new Map()

    timer: number = 0
    currentFrame: number = null
    onAnimationDone: () => any = null
    durationTimeMs: number = null

    constructor(lwsFilepath: string) {
        this.lwsFilepath = lwsFilepath
    }

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
        const msPerFrame = 1000 / this.framesPerSecond * this.transcoef
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
        if (this.polyList.length !== this.animatedPolys.length) throw new Error('Cannot animate polyList. Length differs from animatedPolys length')
        this.animatedPolys.forEach((body: AnimSubObj, index) => {
            const poly = this.polyList[index]
            poly.position.copy(body.relPos[this.currentFrame]).sub(body.pivot)
            if (!this.wheelJoints.includes(poly)) {
                poly.rotation.copy(body.relRot[this.currentFrame])
            }
            poly.scale.copy(body.relScale[this.currentFrame])
            const opacity = body.opacity[this.currentFrame]
            if (opacity !== undefined && opacity !== null) {
                poly.getMaterials().forEach((mat) => mat.setOpacity(opacity))
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
