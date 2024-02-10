import { EntityType } from '../game/model/EntityType'
import { GameState } from '../game/model/GameState'
import { Job } from '../game/model/job/Job'
import { BRICK_ORE_VALUE } from '../params'
import { EventKey } from './EventKeyEnum'
import { Vector2 } from 'three'
import { GameResultState } from '../game/model/GameResult'
import { LevelConfData } from '../game/LevelLoader'
import { BaseEvent } from './EventTypeMap'
import { PriorityEntry } from '../game/model/job/PriorityEntry'
import { Surface } from '../game/terrain/Surface'

export abstract class JobEvent extends BaseEvent {
    job: Job

    protected constructor(job: Job) {
        super(EventKey.JOB_CREATE)
        this.job = job
    }
}

export class JobCreateEvent extends JobEvent {
    constructor(job: Job) {
        super(job)
    }
}

export class RequestedRaidersChanged extends BaseEvent {
    constructor(readonly numRequested: number) {
        super(EventKey.REQUESTED_RAIDERS_CHANGED)
    }
}

export class RequestedVehiclesChanged extends BaseEvent {
    constructor(readonly vehicle: EntityType, readonly numRequested: number) {
        super(EventKey.REQUESTED_VEHICLES_CHANGED)
    }
}

export class MaterialAmountChanged extends BaseEvent {
    numCrystal: number
    totalOre: number

    constructor() {
        super(EventKey.MATERIAL_AMOUNT_CHANGED)
        this.numCrystal = GameState.numCrystal
        this.totalOre = GameState.numOre + GameState.numBrick * BRICK_ORE_VALUE
    }
}

export class UsedCrystalsChanged extends BaseEvent {
    usedCrystals: number

    constructor() {
        super(EventKey.USED_CRYSTALS_CHANGED)
        this.usedCrystals = GameState.usedCrystals
    }
}

export class CavernDiscovered extends BaseEvent {
    constructor() {
        super(EventKey.CAVERN_DISCOVERED)
    }
}

export class OreFoundEvent extends BaseEvent {
    constructor() {
        super(EventKey.ORE_FOUND)
    }
}

export class ToggleAlarmEvent extends BaseEvent {
    constructor(readonly alarmState: boolean) {
        super(EventKey.TOGGLE_ALARM)
    }
}

export class DynamiteExplosionEvent extends BaseEvent {
    constructor(readonly position: Vector2) {
        super(EventKey.DYNAMITE_EXPLOSION)
    }
}

export class GameResultEvent extends BaseEvent {
    constructor(readonly result: GameResultState) {
        super(EventKey.GAME_RESULT_STATE)
    }
}

export class RestartGameEvent extends BaseEvent {
    constructor() {
        super(EventKey.RESTART_GAME)
    }
}

export class LevelSelectedEvent extends BaseEvent {
    constructor(readonly levelConf: LevelConfData) {
        super(EventKey.LEVEL_SELECTED)
    }
}

export class AirLevelChanged extends BaseEvent {
    airLevel: number

    constructor(airLevel: number) {
        super(EventKey.AIR_LEVEL_CHANGED)
        this.airLevel = airLevel
    }
}

export class MonsterEmergeEvent extends BaseEvent {
    constructor(readonly surface: Surface) {
        super(EventKey.MONSTER_EMERGE)
    }
}

export class NerpMessageEvent extends BaseEvent {
    constructor(readonly text: string, readonly messageTimeoutMs: number, readonly arrowDisabled: boolean) {
        super(EventKey.NERP_MESSAGE)
    }
}

export class UpdatePriorities extends BaseEvent {
    priorityList: PriorityEntry[]

    constructor(priorityList: PriorityEntry[]) {
        super(EventKey.UPDATE_PRIORITIES)
        this.priorityList = priorityList
    }
}

export class NerpSuppressArrowEvent extends BaseEvent {
    constructor(readonly suppressArrow: boolean) {
        super(EventKey.NERP_SUPPRESS_ARROW)
    }
}
