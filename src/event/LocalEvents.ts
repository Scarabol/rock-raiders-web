import { GameEvent } from './EventBus'
import { BuildingEntity } from '../scene/model/BuildingEntity'
import { Surface } from '../scene/model/map/Surface'
import { Raider } from '../scene/model/Raider'
import { VehicleEntity } from '../scene/model/VehicleEntity'

export class LocalEvent extends GameEvent {

    constructor(eventKey: string) {
        super(eventKey)
        this.isLocal = true
    }

}

export class SelectionEvent extends LocalEvent {

    static eventKey = 'selected'

    constructor(eventSuffix: string) {
        super(SelectionEvent.eventKey + '.' + eventSuffix)
    }

}

export class SurfaceSelectedEvent extends SelectionEvent {

    static eventSuffix = 'surface'
    static eventKey = SelectionEvent.eventKey + '.' + SurfaceSelectedEvent.eventSuffix

    surface: Surface

    constructor(surface: Surface) {
        super(SurfaceSelectedEvent.eventSuffix)
        this.surface = surface
    }

}

export class BuildingSelected extends SelectionEvent {

    static eventSuffix = 'building'
    static eventKey = SelectionEvent.eventKey + '.' + BuildingSelected.eventSuffix

    building: BuildingEntity

    constructor(building: BuildingEntity) {
        super(BuildingSelected.eventSuffix)
        this.building = building
    }

}

export class RaiderSelected extends SelectionEvent {

    static eventSuffix = 'raider'
    static eventKey = SelectionEvent.eventKey + '.' + RaiderSelected.eventSuffix

    raider: Raider

    constructor(raider: Raider) {
        super(RaiderSelected.eventSuffix)
        this.raider = raider
    }

}

export class VehicleSelected extends SelectionEvent {

    static eventSuffix = 'vehicle'
    static eventKey = SelectionEvent.eventKey + '.' + VehicleSelected.eventSuffix

    vehicle: VehicleEntity

    constructor(vehicle: VehicleEntity) {
        super(VehicleSelected.eventSuffix)
        this.vehicle = vehicle
    }

}

export class EntityDeselected extends LocalEvent {

    static eventKey = 'deselected.entity'

    constructor() {
        super(EntityDeselected.eventKey)
    }

}
