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
    totalOre: number

    constructor() {
        super(EventKey.MATERIAL_AMOUNT_CHANGED)
        this.numCrystal = GameState.numCrystal
        this.totalOre = GameState.numOre + GameState.numBrick * BRICK_ORE_VALUE
    }
}

export class UsedCrystalsChanged extends WorldEvent {
    usedCrystals: number

    constructor() {
        super(EventKey.USED_CRYSTALS_CHANGED)
        this.usedCrystals = GameState.usedCrystals
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
