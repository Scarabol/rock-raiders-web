import { BuildingEntity } from '../game/model/building/BuildingEntity'
import { Surface } from '../game/model/map/Surface'
import { Raider } from '../game/model/raider/Raider'
import { EventKey } from './EventKeyEnum'
import { GameEvent } from './GameEvent'

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

export class EntityDeselected extends LocalEvent {

    constructor() {
        super(EventKey.DESELECTED_ENTITY)
    }

}

export class SurfaceChanged extends LocalEvent {

    surface: Surface

    constructor(surface: Surface) {
        super(EventKey.SURFACE_CHANGED)
        this.surface = surface
    }

}

export class AirLevelChanged extends LocalEvent {

    constructor() {
        super(EventKey.AIR_LEVEL_CHANGED)
    }

}

export class CancelBuildMode extends LocalEvent {

    constructor() {
        super(EventKey.CANCEL_BUILD_MODE)
    }

}
