import { Vector3 } from 'three';
import { CollectableEntity, CollectableType } from '../../../scene/model/collect/CollectableEntity';
import { JOB_ACTION_RANGE, RAIDER_SPEED } from '../../../main';
import { GameState } from '../GameState';
import { EventBus } from '../../../event/EventBus';
import { CollectEvent } from '../../../event/WorldEvents';
import { FulfillerEntity } from '../../../scene/model/FulfillerEntity';

export enum JobType {

    SURFACE,
    CARRY,
    MOVE,

}

export enum JobState {

    OPEN,
    COMPLETE,
    CANCELED,

}

export abstract class Job {

    type: JobType;
    jobstate: JobState;
    fulfiller: FulfillerEntity[] = [];

    protected constructor(type: JobType) {
        this.type = type;
        this.jobstate = JobState.OPEN;
    }

    assign(fulfiller: FulfillerEntity) {
        const index = this.fulfiller.indexOf(fulfiller);
        if (fulfiller && index === -1) {
            this.fulfiller.push(fulfiller);
        }
    }

    unassign(fulfiller: FulfillerEntity) {
        const index = this.fulfiller.indexOf(fulfiller);
        if (index > -1) this.fulfiller.splice(index, 1);
    }

    cancel() {
        this.jobstate = JobState.CANCELED;
        const fulfiller = this.fulfiller; // ensure consistency while processing
        this.fulfiller = [];
        fulfiller.forEach((fulfiller) => fulfiller.stopJob());
    }

    isQualified(fulfiller: FulfillerEntity): boolean {
        return true;
    }

    onJobComplete() {
        this.jobstate = JobState.COMPLETE;
    }

    abstract getPosition(): Vector3; // TODO job system in 2d should be sufficient and decouple from three for deps and worker reasons

    abstract isInArea(x: number, z: number): boolean;

}

export class CollectJob extends Job {

    item: CollectableEntity;

    constructor(item: CollectableEntity) {
        super(JobType.CARRY);
        this.item = item;
    }

    getPosition(): Vector3 {
        return this.item.getPosition();
    }

    isInArea(x: number, z: number): boolean {
        const pos = this.getPosition();
        return pos.sub(new Vector3(x, pos.y, z)).length() < JOB_ACTION_RANGE;
    }

    isQualified(fulfiller: FulfillerEntity) {
        return fulfiller.carries === null && GameState.getBuildingsByType(...this.item.getTargetBuildingTypes()).length > 0;
    }

    onJobComplete() {
        super.onJobComplete();
        switch (this.item.getCollectableType()) {
            case CollectableType.CRYSTAL:
                GameState.numCrystal++;
                EventBus.publishEvent(new CollectEvent(this.item.getCollectableType()));
                break;
            case CollectableType.ORE:
                GameState.numOre++;
                EventBus.publishEvent(new CollectEvent(this.item.getCollectableType()));
                break;
        }
    }

}

export class MoveJob extends Job {

    target: Vector3;

    constructor(target: Vector3) {
        super(JobType.MOVE);
        this.target = target;
    }

    getPosition(): Vector3 {
        return new Vector3().copy(this.target);
    }

    isInArea(x: number, z: number) {
        return this.getPosition().sub(new Vector3(x, this.target.y, z)).lengthSq() < RAIDER_SPEED * RAIDER_SPEED;
    }

}
