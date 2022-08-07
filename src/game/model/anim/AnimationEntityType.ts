import { Mesh } from 'three'
import { SceneMesh } from '../../../scene/SceneMesh'
import { AnimationEntityUpgrade } from './AnimationEntityUpgrade'
import { AnimClip } from './AnimClip'

/**
 * @deprecated
 */
export class AnimationEntityType {
    scale: number = 1
    carryNullName: string = ''
    carryNullFrames: number = 0
    depositNullName: string = ''
    toolNullName: string = ''
    wheelMesh: Mesh = null
    wheelRadius: number = 1
    wheelNullName: string = null
    drillNullName: string = null
    driverNullName: string = null
    xPivot: string = null
    yPivot: string = null
    PivotMinZ: number = 0
    PivotMaxZ: number = 0
    fireNullName: string = null
    cameraNullName: string = null
    cameraNullFrames: number = null
    lowPolyBodies: Map<string, SceneMesh> = new Map()
    mediumPolyBodies: Map<string, SceneMesh> = new Map()
    highPolyBodies: Map<string, SceneMesh> = new Map()
    fPPolyBodies: Map<string, SceneMesh> = new Map()
    animations: Map<string, AnimClip> = new Map()
    upgradesByLevel: Map<string, AnimationEntityUpgrade[]> = new Map()
    firstAnimationName: string = null
}
