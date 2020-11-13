import { GameEvent } from './EventBus';
import { BuildingEntity } from '../scene/model/BuildingEntity';
import { Surface } from '../scene/model/map/Surface';
import { Raider } from '../scene/model/Raider';
import { VehicleEntity } from '../scene/model/VehicleEntity';

export class LocalEvent extends GameEvent {

    constructor(eventKey: string) {
        super(eventKey);
        this.isLocal = true;
    }

}

export class SurfaceSelectedEvent extends LocalEvent {

    static eventKey: string = 'surface.selected';

    surface: Surface;

    constructor(surface: Surface) {
        super(SurfaceSelectedEvent.eventKey);
        this.surface = surface;
    }

}

export class BuildingSelected extends LocalEvent {

    static eventKey: string = 'building.selected';

    building: BuildingEntity;

    constructor(building: BuildingEntity) {
        super(BuildingSelected.eventKey);
        this.building = building;
    }

}

export class BuildingDeselected extends LocalEvent {

    static eventKey: string = 'building.deselected';

    building: BuildingEntity;

    constructor(building: BuildingEntity) {
        super(BuildingDeselected.eventKey);
        this.building = building;
    }

}

export class RaiderSelected extends LocalEvent {

    static eventKey: string = 'raider.select';

    raider: Raider;

    constructor(raider: Raider) {
        super(RaiderSelected.eventKey);
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

export class EntityDeselected extends LocalEvent {

    static eventKey: string = 'entity.deselect';

    constructor() {
        super(EntityDeselected.eventKey);
    }

}