import { EventKey } from './EventKeyEnum'
import { PositionComponent } from '../game/component/PositionComponent'
import { BaseEvent, WorldLocationEventMap } from './EventTypeMap'

export class WorldLocationEvent extends BaseEvent {
    location: PositionComponent

    constructor(eventType: keyof WorldLocationEventMap, location: PositionComponent) {
        super(eventType)
        this.location = location
    }
}

export class GenericDeathEvent extends WorldLocationEvent {
    constructor(location: PositionComponent) {
        super(EventKey.LOCATION_DEATH, location)
    }
}

export class GenericMonsterEvent extends WorldLocationEvent {
    constructor(location: PositionComponent) {
        super(EventKey.LOCATION_MONSTER, location)
    }
}

export class CrystalFoundEvent extends WorldLocationEvent {
    constructor(location: PositionComponent) {
        super(EventKey.LOCATION_CRYSTAL_FOUND, location)
    }
}

export class UnderAttackEvent extends WorldLocationEvent {
    constructor(location: PositionComponent) {
        super(EventKey.LOCATION_UNDER_ATTACK, location)
    }
}

export class LandslideEvent extends WorldLocationEvent {
    constructor(location: PositionComponent) {
        super(EventKey.LOCATION_LANDSLIDE, location)
    }
}

export class PowerDrainEvent extends WorldLocationEvent {
    constructor(location: PositionComponent) {
        super(EventKey.LOCATION_POWER_DRAIN, location)
    }
}

export class SlugEmergeEvent extends WorldLocationEvent {
    constructor(location: PositionComponent) {
        super(EventKey.LOCATION_SLUG_EMERGE, location)
    }
}

export class RaiderDiscoveredEvent extends WorldLocationEvent {
    constructor(location: PositionComponent) {
        super(EventKey.LOCATION_RAIDER_DISCOVERED, location)
    }
}
