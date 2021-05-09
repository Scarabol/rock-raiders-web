import { Euler, MathUtils, Object3D, Vector3 } from 'three'
import degToRad = MathUtils.degToRad

export class AnimSubObj {

    name: string = ''
    filename: string = ''
    pivot: Vector3 = new Vector3(0, 0, 0)
    relPos: Vector3[] = []
    relRot: Euler[] = []
    relScale: Vector3[] = []
    opacity: number[] = []
    parentObjInd: number = null
    model: Object3D = null

    radVec(degX: number, degY: number, degZ: number) {
        return new Euler(degToRad(degY), degToRad(degX), degToRad(degZ), 'YXZ')
    }

    setFrameAndFollowing(animationFrameIndex: number, lastFrame: number, infos: number[]) {
        this.relPos[animationFrameIndex] = new Vector3(infos[0], infos[1], infos[2])
        this.relRot[animationFrameIndex] = this.radVec(infos[3], infos[4], infos[5])
        this.relScale[animationFrameIndex] = new Vector3(infos[6], infos[7], infos[8])
        for (let c = animationFrameIndex; c <= lastFrame; c++) {
            this.relPos[c] = this.relPos[animationFrameIndex]
            this.relRot[c] = this.relRot[animationFrameIndex]
            this.relScale[c] = this.relScale[animationFrameIndex]
        }
    }

    setOpacityAndFollowing(animationFrameIndex: number, lastFrame: number, value: number) {
        for (let c = animationFrameIndex; c <= lastFrame; c++) {
            this.opacity[c] = value
        }
    }

}
