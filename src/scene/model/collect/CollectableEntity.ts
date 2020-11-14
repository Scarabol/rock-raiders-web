import { BaseEntity } from '../BaseEntity';
import { Building } from '../../../game/model/entity/building/Building';

export abstract class CollectableEntity extends BaseEntity {

    abstract getTargetBuildingTypes(): Building[];

    abstract getCollectableType(): CollectableType;

}

export enum CollectableType {

    CRYSTAL,
    ORE,
    BRICK,
    DYNAMITE,
    BARRIER,

}
