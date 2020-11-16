import { Group, Vector3 } from 'three';
import { CollectableType } from './CollectableEntity';
import { WorldManager } from '../../WorldManager';

export interface Carryable {

    worldMgr: WorldManager;
    group: Group;

    getTargetPos(): Vector3;

    getCollectableType(): CollectableType;

}