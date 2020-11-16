import { BaseEntity } from '../BaseEntity';
import { GameState } from '../../../game/model/GameState';
import { EventBus } from '../../../event/EventBus';
import { JobCreateEvent } from '../../../event/WorldEvents';
import { CollectJob } from '../../../game/model/job/Job';
import { Carryable } from './Carryable';
import { Building } from '../../../game/model/entity/building/Building';

export abstract class CollectableEntity extends BaseEntity implements Carryable {

    abstract getCollectableType(): CollectableType;

    abstract getTargetBuildingTypes(): Building[];

    onDiscover() {
        super.onDiscover();
        const index = GameState.collectablesUndiscovered.indexOf(this);
        if (index !== -1) GameState.collectablesUndiscovered.splice(index, 1);
        GameState.collectables.push(this);
        EventBus.publishEvent(new JobCreateEvent(new CollectJob(this)));
    }

}

export enum CollectableType {

    CRYSTAL,
    ORE,
    BRICK,
    DYNAMITE,
    BARRIER,

}
