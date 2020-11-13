import { Surface } from '../../../scene/model/map/Surface';
import { Vector3 } from 'three';
import { Raider } from '../../../scene/model/Raider';
import { Collectable, CollectableType } from '../../../scene/model/Collectable';
import { PICKUP_RANGE, RAIDER_SPEED, TILESIZE } from '../../../main';
import { GameState } from '../GameState';
import { EventBus } from '../../../event/EventBus';
import { CollectEvent } from '../../../event/WorldEvents';

export enum JobType {

    SURFACE,
    CARRY,
    MOVE,

}

export abstract class Job {

    type: JobType;
    raiders: Raider[] = [];

    constructor(type: JobType) {
        this.type = type;
    }

    assign(raider: Raider) {
        const index = this.raiders.indexOf(raider);
        if (raider && index === -1) {
            this.raiders.push(raider);
        }
    }

    unassign(raider: Raider) {
        const index = this.raiders.indexOf(raider);
        if (index > -1) this.raiders.splice(index, 1);
    }

    cancel() {
        this.raiders.forEach((raider) => raider.stopJob());
    }

    isQualified(raider: Raider): boolean {
        return true;
    }

    onJobComplete() {
        // nothing to do here
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

    static readonly DRILL = new SurfaceJobType(0xa0a0a0, ['drill'], []);
    static readonly REINFORCE = new SurfaceJobType(0x6060a0, ['hammer'], []);
    static readonly BLOW = new SurfaceJobType(0xa06060, [], ['demolition']);
    static readonly CLEAR_RUBBLE = new SurfaceJobType(0xffffff, ['shovel'], []);

}

export class SurfaceJob extends Job {

    surface: Surface;
    workType: SurfaceJobType;

    constructor(workType: SurfaceJobType, surface: Surface) {
        super(JobType.SURFACE);
        this.surface = surface;
        this.workType = workType;
    }

    isQualified(raider: Raider) {
        return raider.hasTools(this.workType.requiredTools) && raider.hasSkills(this.workType.requiredSkills);
    }

    getPosition(): Vector3 {
        return new Vector3(this.surface.x * TILESIZE + TILESIZE / 2, 0,
            this.surface.y * TILESIZE + TILESIZE / 2);
    }

    isInArea(x: number, z: number) {
        // TODO check square distance first?
        return x >= this.surface.x * TILESIZE && x < this.surface.x * TILESIZE + TILESIZE
            && z >= this.surface.y * TILESIZE && z < this.surface.y * TILESIZE + TILESIZE;
    }

    onJobComplete() {
        switch (this.workType) {
            case SurfaceJobType.DRILL:
                this.surface.collapse();
                break;
            case SurfaceJobType.BLOW:
                // TODO start dynamite countdown
                break;
            case SurfaceJobType.REINFORCE:
                // this.surface.reinforce(); // TODO implement this
                break;
            case SurfaceJobType.CLEAR_RUBBLE:
                this.surface.reduceRubble();
                break;
        }
    }

}

export class CollectJob extends Job {

    item: Collectable;

    constructor(item: Collectable) {
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

    isQualified(raider: Raider) {
        return raider.carries === null;
    }

    onJobComplete() {
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
