import { Group, Object3D } from 'three'
import { clearTimeoutSafe } from '../../../core/Util'
import { SequenceTextureMaterial } from '../../../scene/SequenceTextureMaterial'
import { AnimSubObj } from './AnimSubObj'

export class AnimClip {

    looping: boolean = false
    transcoef: number = 1
    firstFrame: number = null
    lastFrame: number = null
    framesPerSecond: number = null
    bodies: AnimSubObj[] = []
    polyList: Object3D[] = []
    carryJoint: Object3D = null
    depositJoint: Object3D = null
    getToolJoint: Object3D = null
    wheelJoints: Object3D[] = []
    drillJoint: Object3D = null
    driverJoint: Object3D = null
    nullJoints: Map<string, Object3D[]> = new Map()
    polyModel: Group = new Group()
    animationTimeout = null

    animate(frameIndex: number, onAnimationDone: () => any, durationTimeMs: number) {
        if (this.polyList.length !== this.bodies.length) throw 'Cannot animate poly. Length differs from bodies length'
        this.bodies.forEach((body: AnimSubObj, index) => {
            const p = this.polyList[index]
            p.position.copy(body.relPos[frameIndex]).sub(body.pivot)
            p.rotation.copy(body.relRot[frameIndex])
            p.scale.copy(body.relScale[frameIndex])
            if (p.hasOwnProperty('material')) {
                const material = p['material']
                const opacity = body.opacity[frameIndex]
                if (material && opacity !== undefined) {
                    const matArr = Array.isArray(material) ? material : [material]
                    matArr.forEach((mat: SequenceTextureMaterial) => mat.setOpacity(opacity))
                }
            }
        })
        this.animationTimeout = clearTimeoutSafe(this.animationTimeout)
        let nextFrame = frameIndex + 1
        if (nextFrame <= this.lastFrame || !onAnimationDone || (durationTimeMs !== null && durationTimeMs > 0)) {
            if (nextFrame > this.lastFrame) {
                nextFrame = this.firstFrame
            }
            const standardDurationTimeMs = 1000 / this.framesPerSecond * this.transcoef
            if (durationTimeMs !== null) durationTimeMs -= standardDurationTimeMs
            const that = this
            const timeoutTimeMs = durationTimeMs !== null ? Math.max(0, Math.min(durationTimeMs, standardDurationTimeMs)) : standardDurationTimeMs
            this.animationTimeout = setTimeout(() => that.animate(nextFrame, onAnimationDone, durationTimeMs), timeoutTimeMs)
        } else if (onAnimationDone) {
            onAnimationDone()
        }
    }

    stop() {
        this.animationTimeout = clearTimeoutSafe(this.animationTimeout)
    }

}
