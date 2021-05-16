import { Object3D } from 'three'
import { AnimClip } from './AnimClip'

export class AnimationEntityType {

    carryNullName: string = ''
    depositNullName: string = ''
    toolNullName: string = ''
    mediumPolyBodies: Map<string, Object3D> = new Map()
    highPolyBodies: Map<string, Object3D> = new Map()
    fPPolyBodies: Map<string, Object3D> = new Map()
    animations: Map<string, AnimClip> = new Map()

}
