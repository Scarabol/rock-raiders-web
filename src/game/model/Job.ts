import { Surface } from './map/Surface';

export enum JobType {

    DRILL,
    REINFORCE,
    BLOW,
    CLEAR_RUBBLE,

}

export class Job {

    type: JobType;

    constructor(type: JobType) {
        this.type = type;
    }

}

export class SurfaceJob extends Job {

    surface: Surface;

    constructor(type: JobType.DRILL | JobType.REINFORCE | JobType.BLOW | JobType.CLEAR_RUBBLE, surface: Surface) {
        super(type);
        this.surface = surface;
    }

}
