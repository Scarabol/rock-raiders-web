import { AnimEntityAnimationData, AnimEntityData } from '../resource/AnimEntityParser'
import { AnimationGroup } from './AnimationGroup'
import { SceneMesh } from './SceneMesh'

export class AnimationQualityGroup extends AnimationGroup {
    constructor(readonly animEntityData: AnimEntityData, animData: AnimEntityAnimationData, onAnimationDone: () => void, durationTimeoutMs: number = 0, onAnimationTrigger: () => void = null) {
        super(animData.file, onAnimationDone, durationTimeoutMs, onAnimationTrigger)
        this.animationTransCoef = 1 / (animData.transcoef || 1)
        this.animationTriggerTimeMs = Math.round(animData.trigger / 25 * 1000) // TODO Use actual animation speed from LWS
    }

    protected resolveMesh(lowerName: string): SceneMesh { // TODO support other mesh quality levels and FPP cameras
        return super.resolveMesh(this.animEntityData.highPolyBodies.get(lowerName))
            || super.resolveMesh(this.animEntityData.mediumPolyBodies.get(lowerName))
            || super.resolveMesh(this.animEntityData.lowPolyBodies.get(lowerName))
            || super.resolveMesh(lowerName)
    }
}
