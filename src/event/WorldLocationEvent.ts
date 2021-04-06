import { WorldEvent } from './WorldEvents'
import { Vector3 } from 'three'

export class WorldLocationEvent extends WorldEvent {

    location: Vector3

    constructor(entityKey: string, location: Vector3) {
        super(entityKey)
        this.location = location
    }

}

export class GenericDeathEvent extends WorldLocationEvent {

    static eventKey = 'location.death'

    constructor(location: Vector3) {
        super(GenericDeathEvent.eventKey, location)
    }

}

export class GenericMonsterEvent extends WorldLocationEvent {

    static eventKey = 'location.monster'

    constructor(location: Vector3) {
        super(GenericMonsterEvent.eventKey, location)
    }

}

export class CrystalFoundEvent extends WorldLocationEvent {

    static eventKey = 'location.crystal_found'

    constructor(location: Vector3) {
        super(CrystalFoundEvent.eventKey, location)
    }

}

export class UnderAttackEvent extends WorldLocationEvent {

    static eventKey = 'location.under_attack'

    constructor(location: Vector3) {
        super(UnderAttackEvent.eventKey, location)
    }

}

export class LandslideEvent extends WorldLocationEvent {

    static eventKey = 'location.landslide'

    constructor(location: Vector3) {
        super(LandslideEvent.eventKey, location)
    }

}

export class PowerDrainEvent extends WorldLocationEvent {

    static eventKey = 'location.power_drain'

    constructor(location: Vector3) {
        super(PowerDrainEvent.eventKey, location)
    }

}

export class SlugEmergeEvent extends WorldLocationEvent {

    static eventKey = 'location.slug_emerge'

    constructor(location: Vector3) {
        super(SlugEmergeEvent.eventKey, location)
    }

}

export class RaiderDiscoveredEvent extends WorldLocationEvent {

    static eventKey = 'location.raider_discovered'

    constructor(location: Vector3) {
        super(RaiderDiscoveredEvent.eventKey, location)
    }

}
