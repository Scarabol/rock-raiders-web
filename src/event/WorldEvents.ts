import { EntityType } from '../game/model/EntityType'
import { GameState } from '../game/model/GameState'
import { Job } from '../game/model/job/Job'
import { EventKey } from './EventKeyEnum'
import { Vector2 } from 'three'
import { GameResultState } from '../game/model/GameResult'
import { LevelConfData } from '../game/LevelLoader'
import { BaseEvent, WorldLocationEventMap } from './EventTypeMap'
import { PriorityEntry } from '../game/model/job/PriorityEntry'
import { Surface } from '../game/terrain/Surface'
import { GameEntity } from '../game/ECS'
import { WeaponTypeCfg } from '../cfg/WeaponTypeCfg'
import { PositionComponent } from '../game/component/PositionComponent'

export class JobCreateEvent extends BaseEvent {
    constructor(readonly job: Job) {
        super(EventKey.JOB_CREATE)
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
    readonly numCrystal: number
    readonly totalOre: number

    constructor() {
        super(EventKey.MATERIAL_AMOUNT_CHANGED)
        this.numCrystal = GameState.numCrystal
        this.totalOre = GameState.numOreValue
    }
}

export class UsedCrystalsChanged extends BaseEvent {
    readonly usedCrystals: number

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
    constructor(readonly airLevel: number) {
        super(EventKey.AIR_LEVEL_CHANGED)
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
    constructor(readonly priorityList: PriorityEntry[]) {
        super(EventKey.UPDATE_PRIORITIES)
    }
}

export class NerpSuppressArrowEvent extends BaseEvent {
    constructor(readonly suppressArrow: boolean) {
        super(EventKey.NERP_SUPPRESS_ARROW)
    }
}

export class ShootLaserEvent extends BaseEvent {
    constructor(readonly entity: GameEntity) {
        super(EventKey.SHOOT_LASER)
    }
}

export class MonsterLaserHitEvent extends BaseEvent {
    constructor(readonly entity: GameEntity, readonly weaponCfg: WeaponTypeCfg) {
        super(EventKey.MONSTER_LASER_HIT)
    }
}

export class WorldLocationEvent extends BaseEvent {
    constructor(eventType: keyof WorldLocationEventMap, readonly location: PositionComponent) {
        super(eventType)
    }
}
