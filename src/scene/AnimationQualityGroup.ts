import { getPath } from '../core/Util'
import { AnimEntityAnimationData, AnimEntityData } from '../resource/AnimEntityParser'
import { AnimationGroup } from './AnimationGroup'
import { SceneMesh } from './SceneMesh'
import { ResourceManager } from '../resource/ResourceManager'
import { DEV_MODE } from '../params'

export class AnimationQualityGroup extends AnimationGroup {
    constructor(readonly animEntityData: AnimEntityData, animData: AnimEntityAnimationData, readonly onAnimationDone: () => unknown) {
        super(animData.file, onAnimationDone)
        this.animationTransCoef = 1 / (animData.transcoef || 1)
    }

    protected resolveMesh(lowerName: string): SceneMesh { // TODO support other mesh quality levels and FPP cameras
        return this.meshOrNull(this.animEntityData.highPolyBodies.get(lowerName))
            || this.meshOrNull(this.animEntityData.mediumPolyBodies.get(lowerName))
            || this.meshOrNull(this.animEntityData.lowPolyBodies.get(lowerName))
            || ResourceManager.getLwoModel(getPath(this.lwsFilepath) + lowerName)
    }

    private meshOrNull(lowerName: string) {
        try {
            return ResourceManager.getLwoModel(lowerName)
        } catch (e) {
            if (!DEV_MODE) console.warn(e)
            return null
        }
    }
}
