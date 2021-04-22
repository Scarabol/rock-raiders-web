import { Group, Vector2 } from 'three'
import { CollectableType } from './CollectableEntity'
import { WorldManager } from '../../WorldManager'
import { PathTarget } from '../PathTarget'

export interface Carryable {

    worldMgr: WorldManager;
    group: Group;

    getPosition2D(): Vector2

    hasTarget(): boolean

    getCarryTargets(): PathTarget[]

    getCollectableType(): CollectableType

}
