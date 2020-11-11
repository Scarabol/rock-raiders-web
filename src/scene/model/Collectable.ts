import { BaseEntity } from './BaseEntity';

export interface Collectable extends BaseEntity {

    getCollectableType(): CollectableType;

}

export enum CollectableType {

    CRYSTAL,
    ORE,

}