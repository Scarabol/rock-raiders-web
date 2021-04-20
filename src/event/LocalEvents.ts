import { GameEvent } from './GameEvent'
import { BuildingEntity } from '../scene/model/BuildingEntity'
import { Surface } from '../scene/model/map/Surface'
import { Raider } from '../scene/model/Raider'
import { VehicleEntity } from '../scene/model/VehicleEntity'
import { EventKey } from './EventKeyEnum'

export class LocalEvent extends GameEvent {

    constructor(eventKey: EventKey) {
        super(eventKey)
        this.isLocal = true
    }

}

export class SelectionEvent extends LocalEvent {

    constructor(eventKey: EventKey) {
        super(eventKey)
    }

}

export class SurfaceSelectedEvent extends SelectionEvent {

    surface: Surface

    constructor(surface: Surface) {
        super(EventKey.SELECTED_SURFACE)
        this.surface = surface
    }

}

export class BuildingSelected extends SelectionEvent {

    building: BuildingEntity

    constructor(building: BuildingEntity) {
        super(EventKey.SELECTED_BUILDING)
        this.building = building
    }

}

export class RaiderSelected extends SelectionEvent {

    raider: Raider

    constructor(raider: Raider) {
        super(EventKey.SELECTED_RAIDER)
        this.raider = raider
    }

}

export class VehicleSelected extends SelectionEvent {

    vehicle: VehicleEntity

    constructor(vehicle: VehicleEntity) {
        super(EventKey.SELECTED_VEHICLE)
        this.vehicle = vehicle
    }

}

export class EntityDeselected extends LocalEvent {

    constructor() {
        super(EventKey.DESELECTED_ENTITY)
    }

}
