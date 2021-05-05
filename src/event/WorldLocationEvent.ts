import { Vector3 } from 'three'
import { EventKey } from './EventKeyEnum'
import { WorldEvent } from './WorldEvents'

export interface LocationProvider {

    getPosition(): Vector3

}

export class WorldLocationEvent extends WorldEvent {

    locationProvider: LocationProvider

    constructor(entityKey: EventKey, locationProvider: LocationProvider) {
        super(entityKey)
        this.locationProvider = locationProvider
    }

}

export class GenericDeathEvent extends WorldLocationEvent {

    constructor(locationProvider: LocationProvider) {
        super(EventKey.LOCATION_DEATH, locationProvider)
    }

}

export class GenericMonsterEvent extends WorldLocationEvent {

    constructor(locationProvider: LocationProvider) {
        super(EventKey.LOCATION_MONSTER, locationProvider)
    }

}

export class CrystalFoundEvent extends WorldLocationEvent {

    constructor(locationProvider: LocationProvider) {
        super(EventKey.LOCATION_CRYSTAL_FOUND, locationProvider)
    }

}

export class UnderAttackEvent extends WorldLocationEvent {

    constructor(locationProvider: LocationProvider) {
        super(EventKey.LOCATION_UNDER_ATTACK, locationProvider)
    }

}

export class LandslideEvent extends WorldLocationEvent {

    constructor(locationProvider: LocationProvider) {
        super(EventKey.LOCATION_LANDSLIDE, locationProvider)
    }

}

export class PowerDrainEvent extends WorldLocationEvent {

    constructor(locationProvider: LocationProvider) {
        super(EventKey.LOCATION_POWER_DRAIN, locationProvider)
    }

}

export class SlugEmergeEvent extends WorldLocationEvent {

    constructor(locationProvider: LocationProvider) {
        super(EventKey.LOCATION_SLUG_EMERGE, locationProvider)
    }

}

export class RaiderDiscoveredEvent extends WorldLocationEvent {

    constructor(locationProvider: LocationProvider) {
        super(EventKey.LOCATION_RAIDER_DISCOVERED, locationProvider)
    }

}
