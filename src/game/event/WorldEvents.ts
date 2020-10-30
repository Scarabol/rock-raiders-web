import { GameEvent } from './EventBus';
import { Job } from '../model/job/Job';
import { Raider } from '../model/entity/Raider';
import { LocalEvent } from './LocalEvents';
import { VehicleEntity } from '../model/entity/vehicle/VehicleEntity';

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

    RAIDER,
    DYNAMITE,

}

export class RaiderSelected extends LocalEvent {

    static eventKey: string = 'raider.select';

    raider: Raider;

    constructor(raider: Raider) {
        super(RaiderSelected.eventKey);
        this.raider = raider;
    }

}

export class RaiderDeselected extends LocalEvent {

    static eventKey: string = 'raider.deselect';

    raider: Raider;

    constructor(raider: Raider) {
        super(RaiderDeselected.eventKey);
        this.raider = raider;
    }

}

export class VehicleSelected extends LocalEvent {

    static eventKey: string = 'vehicle.select';

    vehicle: VehicleEntity;

    constructor(vehicle: VehicleEntity) {
        super(VehicleSelected.eventKey);
        this.vehicle = vehicle;
    }

}

export class VehicleDeselected extends LocalEvent {

    static eventKey: string = 'vehicle.deselect';

    vehicle: VehicleEntity;

    constructor(vehicle: VehicleEntity) {
        super(VehicleDeselected.eventKey);
        this.vehicle = vehicle;
    }

}
