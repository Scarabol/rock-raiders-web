import { AnimClip } from './AnimClip'

export class AnimationEntityType {

    carryNullName: string = ''
    mediumPoly: {} = {}
    highPoly: {} = {}
    fPPoly: {} = {}
    activities: Map<string, { file: string, transcoef: number, lwsfile: boolean, animation: AnimClip }> = new Map()

}
