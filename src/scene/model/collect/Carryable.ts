import { Group, Vector2 } from 'three'
import { CollectableType } from './CollectableEntity'
import { WorldManager } from '../../WorldManager'

export interface Carryable {

    worldMgr: WorldManager;
    group: Group;

    hasTarget(): boolean

    getTargetPositions(): Vector2[];

    getCollectableType(): CollectableType;

}
