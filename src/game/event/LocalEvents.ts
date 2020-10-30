import { GameEvent } from './EventBus';
import { SurfaceType } from '../model/map/SurfaceType';
import { Raider } from '../model/entity/Raider';
import { BuildingEntity } from '../model/entity/building/BuildingEntity';

export class LocalEvent extends GameEvent {

    constructor(eventKey: string) {
        super(eventKey);
        this.isLocal = true;
    }

}

export class SurfaceSelectedEvent extends LocalEvent {

    static eventKey: string = 'surface.selected';

    type: SurfaceType;

    constructor(type: SurfaceType) {
        super(SurfaceSelectedEvent.eventKey);
        this.type = type;
    }

}

export class SurfaceDeselectEvent extends LocalEvent {

    static eventKey: string = 'surface.deselect';

    constructor() {
        super(SurfaceDeselectEvent.eventKey);
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
