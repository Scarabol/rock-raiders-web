import { Surface } from '../../../scene/model/map/Surface';
import { Vector3 } from 'three';
import { Raider } from '../../../scene/model/Raider';

export enum JobType {

    SURFACE,

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

    abstract isQualified(raider: Raider);

    abstract getPosition(): Vector3; // TODO job system in 2d should be sufficient and decouple from three for deps and worker reasons

    abstract isInArea(x: number, z: number);

    abstract onJobComplete();

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
        return new Vector3(this.surface.x * 40 + 20, 0, this.surface.y * 40 + 20); // TODO externalize tile size or manage world position for surfaces?!
    }

    isInArea(x: number, z: number) {
        // TODO check square distance first
        return x >= this.surface.x * 40 && x < this.surface.x * 40 + 40 && z >= this.surface.y * 40 && z < this.surface.y * 40 + 40;
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
                // this.surface.reduceRubble(); // TODO implement this
                break;
        }
    }

}
