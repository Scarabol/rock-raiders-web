import { GameEvent } from './EventBus';
import { Job } from '../game/model/job/Job';
import { CollectableType } from '../scene/model/Collectable';

export class WorldEvent extends GameEvent {

    constructor(entityKey: string) {
        super(entityKey);
        this.isLocal = false;
    }

}

export class JobEvent extends WorldEvent {

    job: Job;

    constructor(eventKey: string, job: Job) {
        super(eventKey);
        this.job = job;
    }

}

export class JobCreateEvent extends JobEvent {

    static eventKey = 'job.create';

    constructor(job: Job) {
        super(JobCreateEvent.eventKey, job);
    }

}

export class JobDeleteEvent extends JobEvent {

    static eventKey = 'job.delete';

    constructor(job: Job) {
        super(JobDeleteEvent.eventKey, job);
    }

}

export class SpawnEvent extends WorldEvent {

    static eventKey = 'spawn.entity';

    type: SpawnType;
    consumed: boolean;

    constructor(type: SpawnType) {
        super(SpawnEvent.eventKey);
        this.type = type;
    }

}

export enum SpawnType {

    DYNAMITE,

}

export class RaiderRequested extends WorldEvent {

    static eventKey = 'raider.request';

    numRequested: number = 0;

    constructor(numRequested: number) {
        super(RaiderRequested.eventKey);
        this.numRequested = numRequested;
    }

}

export class CollectEvent extends WorldEvent {

    static eventKey = 'item.collected';

    collectType: CollectableType;

    constructor(collectType: CollectableType) {
        super(CollectEvent.eventKey);
        this.collectType = collectType;
    }

}

