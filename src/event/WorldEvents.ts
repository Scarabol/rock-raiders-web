import { EntityType } from '../game/model/EntityType'
import { GameState } from '../game/model/GameState'
import { SupervisedJob } from '../game/Supervisor'
import { BRICK_ORE_VALUE } from '../params'
import { EventKey } from './EventKeyEnum'
import { GameEvent } from './GameEvent'

export class WorldEvent extends GameEvent {
    constructor(entityKey: EventKey) {
        super(entityKey)
        this.isLocal = false
    }
}

export abstract class JobEvent extends WorldEvent {
    job: SupervisedJob

    protected constructor(eventKey: EventKey, job: SupervisedJob) {
        super(eventKey)
        this.guiForward = false
        this.job = job
    }
}

export class JobCreateEvent extends JobEvent {
    constructor(job: SupervisedJob) {
        super(EventKey.JOB_CREATE, job)
    }
}

export class JobDeleteEvent extends JobEvent {
    constructor(job: SupervisedJob) {
        super(EventKey.JOB_DELETE, job)
    }
}

export class RequestedRaidersChanged extends WorldEvent {
    numRequested: number

    constructor(numRequested: number) {
        super(EventKey.REQUESTED_RAIDERS_CHANGED)
        this.numRequested = numRequested
    }
}

export class RequestedVehiclesChanged extends WorldEvent {
    vehicle: EntityType
    numRequested: number

    constructor(vehicle: EntityType, numRequested: number) {
        super(EventKey.REQUESTED_VEHICLES_CHANGED)
        this.vehicle = vehicle
        this.numRequested = numRequested
    }
}

export class MaterialAmountChanged extends WorldEvent {
    numCrystal: number
    neededCrystal: number
    totalOre: number

    constructor() {
        super(EventKey.MATERIAL_AMOUNT_CHANGED)
        this.numCrystal = GameState.numCrystal
        this.neededCrystal = GameState.neededCrystals
        this.totalOre = GameState.numOre + GameState.numBrick * BRICK_ORE_VALUE
    }
}

export class UsedCrystalChanged extends WorldEvent {
    usedCrystal: number

    constructor() {
        super(EventKey.USED_CRYSTAL_CHANGED)
        this.usedCrystal = GameState.usedCrystals
    }
}

export class CavernDiscovered extends WorldEvent {
    constructor() {
        super(EventKey.CAVERN_DISCOVERED)
    }
}

export class OreFoundEvent extends WorldEvent {
    constructor() {
        super(EventKey.ORE_FOUND)
    }
}
