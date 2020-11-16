import { Group } from 'three';
import { Building } from '../../../game/model/entity/building/Building';
import { CollectableType } from './CollectableEntity';

export interface Carryable {

    group: Group;

    getTargetBuildingTypes(): Building[];

    getCollectableType(): CollectableType;

}