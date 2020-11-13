import { BaseEntity } from '../BaseEntity';
import { Building } from '../../../game/model/entity/building/Building';

export interface Collectable extends BaseEntity {

    getTargetBuildingTypes(): Building[];

    getCollectableType(): CollectableType;

}

export enum CollectableType {

    CRYSTAL,
    ORE,
    BRICK,
    DYNAMITE,
    BARRIER,

}
