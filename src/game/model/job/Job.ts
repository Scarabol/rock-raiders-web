import { Surface } from '../../../scene/model/map/Surface';
import { Vector3 } from 'three';
import { CollectableEntity, CollectableType } from '../../../scene/model/collect/CollectableEntity';
import { PICKUP_RANGE, RAIDER_SPEED, TILESIZE } from '../../../main';
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

    constructor(type: JobType) {
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

    abstract isInArea(x: number, z: number);

}

export class SurfaceJobType {

    color: number;
    requiredTools: string[];
    requiredSkills: string[];

    constructor(color: number, requiredTools: string[], requiredSkills: string[]) {
        this.color = color;
        this.requiredTools = requiredTools;
        this.requiredSkills = requiredSkills;
    }

    static readonly DRILL = new SurfaceJobType(0xa0a0a0, ['drill'], []); // TODO externalize constant
    static readonly REINFORCE = new SurfaceJobType(0x60a060, ['hammer'], []); // TODO externalize constant
    static readonly BLOW = new SurfaceJobType(0xa06060, [], ['demolition']); // TODO externalize constant
    static readonly CLEAR_RUBBLE = new SurfaceJobType(0xffffff, ['shovel'], []); // TODO externalize constant

}

export class SurfaceJob extends Job {

    surface: Surface;
    workType: SurfaceJobType;

    constructor(workType: SurfaceJobType, surface: Surface) {
        super(JobType.SURFACE);
        this.surface = surface;
        this.workType = workType;
    }

    isQualified(fulfiller: FulfillerEntity) {
        return fulfiller.hasTools(this.workType.requiredTools) && fulfiller.hasSkills(this.workType.requiredSkills);
    }

    getPosition(): Vector3 {
        if (this.workType === SurfaceJobType.CLEAR_RUBBLE) {
            return new Vector3(this.surface.x * TILESIZE + TILESIZE / 2, 0, this.surface.y * TILESIZE + TILESIZE / 2);
        } else {
            const digPos = this.surface.getDigPositions()[0];
            digPos.y = this.surface.terrain.worldMgr.getTerrainHeight(digPos.x, digPos.z);
            return digPos;
        }
    }

    isInArea(x: number, z: number) {
        if (this.workType === SurfaceJobType.CLEAR_RUBBLE) {
            return x >= this.surface.x * TILESIZE + 5 && x < this.surface.x * TILESIZE + TILESIZE + 5
                && z >= this.surface.y * TILESIZE + 5 && z < this.surface.y * TILESIZE + TILESIZE + 5;
        } else {
            const pos = this.getPosition();
            return pos.sub(new Vector3(x, pos.y, z)).length() < JOB_ACTION_RANGE;
        }
    }

    onJobComplete() {
        super.onJobComplete();
        switch (this.workType) {
            case SurfaceJobType.DRILL:
                this.surface.collapse();
                break;
            case SurfaceJobType.BLOW:
                // TODO start dynamite countdown
                break;
            case SurfaceJobType.REINFORCE:
                this.surface.reinforce();
                break;
            case SurfaceJobType.CLEAR_RUBBLE:
                this.surface.reduceRubble();
                break;
        }
    }

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

    isInArea(x: number, z: number) {
        const pos = this.getPosition();
        return pos.sub(new Vector3(x, pos.y, z)).length() < PICKUP_RANGE;
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
