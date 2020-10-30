import { Surface } from '../map/Surface';
import { MovableEntity } from '../entity/MovableEntity';
import { Vector3 } from 'three';

export enum JobType {

    DRILL,
    REINFORCE,
    BLOW,
    CLEAR_RUBBLE,

}

export abstract class Job {

    type: JobType;

    constructor(type: JobType) {
        this.type = type;
    }

    isQualified(entity: MovableEntity) {
        return true;
    }

    abstract getPosition(): Vector3; // TODO job system in 2d should be sufficient and decouple from three for deps and worker reasons

}

export class SurfaceJob extends Job {

    surface: Surface;
    color: number;

    constructor(type: JobType.DRILL | JobType.REINFORCE | JobType.BLOW | JobType.CLEAR_RUBBLE, surface: Surface) {
        super(type);
        this.surface = surface;
        switch (type) {
            case JobType.DRILL:
                this.color = 0xa0a0a0;
                break;
            case JobType.REINFORCE:
                this.color = 0x00a000;
                break;
            case JobType.BLOW:
                this.color = 0xa0000;
                break;
        }
    }

    getPosition(): Vector3 {
        return new Vector3(this.surface.x * 40, 0, this.surface.y * 40); // TODO externalize tile size or manage world position for surfaces?!
    }

}
