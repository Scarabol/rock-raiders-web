import { GameState } from '../game/model/GameState'
import { PublicJob } from '../game/model/job/Job'
import { EventKey } from './EventKeyEnum'
import { GameEvent } from './GameEvent'

export class WorldEvent extends GameEvent {

    constructor(entityKey: EventKey) {
        super(entityKey)
        this.isLocal = false
    }

}

export abstract class JobEvent extends WorldEvent {

    job: PublicJob

    protected constructor(eventKey: EventKey, job: PublicJob) {
        super(eventKey)
        this.guiForward = false
        this.job = job
    }

}

export class JobCreateEvent extends JobEvent {

    constructor(job: PublicJob) {
        super(EventKey.JOB_CREATE, job)
    }

}

export class JobDeleteEvent extends JobEvent {

    constructor(job: PublicJob) {
        super(EventKey.JOB_DELETE, job)
    }

}

export class RequestedRaidersChanged extends WorldEvent {

    numRequestedRaiders: number

    constructor(requestedRaiders: number) {
        super(EventKey.REQUESTED_RAIDERS_CHANGED)
        this.numRequestedRaiders = requestedRaiders
    }

}

export class MaterialAmountChanged extends WorldEvent {

    numCrystal: number
    usedCrystal: number
    neededCrystal: number
    totalOre: number

    constructor() {
        super(EventKey.MATERIAL_AMOUNT_CHANGED)
        this.numCrystal = GameState.numCrystal
        this.usedCrystal = GameState.usedCrystals
        this.neededCrystal = GameState.neededCrystals
        this.totalOre = GameState.totalOre
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
