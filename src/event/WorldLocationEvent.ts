import { Vector3 } from 'three'
import { EventKey } from './EventKeyEnum'
import { WorldEvent } from './WorldEvents'

export class WorldLocationEvent extends WorldEvent {

    location: Vector3

    constructor(entityKey: EventKey, location: Vector3) {
        super(entityKey)
        this.location = location
    }

}

export class GenericDeathEvent extends WorldLocationEvent {

    constructor(location: Vector3) {
        super(EventKey.LOCATION_DEATH, location)
    }

}

export class GenericMonsterEvent extends WorldLocationEvent {

    constructor(location: Vector3) {
        super(EventKey.LOCATION_MONSTER, location)
    }

}

export class CrystalFoundEvent extends WorldLocationEvent {

    constructor(location: Vector3) {
        super(EventKey.LOCATION_CRYSTAL_FOUND, location)
    }

}

export class UnderAttackEvent extends WorldLocationEvent {

    constructor(location: Vector3) {
        super(EventKey.LOCATION_UNDER_ATTACK, location)
    }

}

export class LandslideEvent extends WorldLocationEvent {

    constructor(location: Vector3) {
        super(EventKey.LOCATION_LANDSLIDE, location)
    }

}

export class PowerDrainEvent extends WorldLocationEvent {

    constructor(location: Vector3) {
        super(EventKey.LOCATION_POWER_DRAIN, location)
    }

}

export class SlugEmergeEvent extends WorldLocationEvent {

    constructor(location: Vector3) {
        super(EventKey.LOCATION_SLUG_EMERGE, location)
    }

}

export class RaiderDiscoveredEvent extends WorldLocationEvent {

    constructor(location: Vector3) {
        super(EventKey.LOCATION_RAIDER_DISCOVERED, location)
    }

}
