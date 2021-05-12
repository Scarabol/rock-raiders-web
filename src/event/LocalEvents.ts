import { BuildingEntity } from '../game/model/building/BuildingEntity'
import { EntityType } from '../game/model/EntityType'
import { GameState } from '../game/model/GameState'
import { PriorityEntry } from '../game/model/job/PriorityList'
import { Surface } from '../game/model/map/Surface'
import { SurfaceType } from '../game/model/map/SurfaceType'
import { Raider } from '../game/model/raider/Raider'
import { AllRaiderTools, RaiderTool } from '../game/model/raider/RaiderTool'
import { AllRaiderTrainings, RaiderTraining } from '../game/model/raider/RaiderTraining'
import { SelectionType } from '../game/model/Selectable'
import { Cursor } from '../screen/Cursor'
import { EventKey } from './EventKeyEnum'
import { GameEvent } from './GameEvent'

export class LocalEvent extends GameEvent {

    constructor(eventKey: EventKey) {
        super(eventKey)
        this.isLocal = true
    }

}

export class SelectionChanged extends LocalEvent {

    selectionType: SelectionType
    isGround: boolean
    isPowerPath: boolean
    canPlaceFence: boolean
    isFloor: boolean
    isSite: boolean
    hasRubble: boolean
    isDrillable: boolean
    isDrillableHard: boolean
    isReinforcable: boolean
    someCarries: boolean
    everyHasMaxLevel: boolean
    canDoTraining: Map<RaiderTraining, boolean> = new Map()
    everyHasTool: Map<RaiderTool, boolean> = new Map()
    buildingCanUpgrade: boolean
    buildingCanSwitchPower: boolean

    constructor(selectionType: SelectionType = SelectionType.NOTHING, selectedSurface: Surface = null, selectedBuilding: BuildingEntity = null, selectedRaiders: Raider[] = null) {
        super(EventKey.SELECTION_CHANGED)
        this.selectionType = selectionType
        this.isGround = selectedSurface?.surfaceType === SurfaceType.GROUND
        this.isPowerPath = selectedSurface?.surfaceType === SurfaceType.POWER_PATH
        this.isFloor = selectedSurface?.surfaceType.floor
        this.isSite = selectedSurface?.surfaceType === SurfaceType.POWER_PATH_CONSTRUCTION || selectedSurface?.surfaceType === SurfaceType.POWER_PATH_BUILDING_SITE
        this.hasRubble = selectedSurface?.hasRubble()
        this.isDrillable = selectedSurface?.isDrillable()
        this.isDrillableHard = selectedSurface?.isDrillableHard()
        this.isReinforcable = selectedSurface?.isReinforcable()
        this.canPlaceFence = selectedSurface?.canPlaceFence() && GameState.buildings.some((b) => b.entityType === EntityType.POWER_STATION && b.isUsable())
        this.someCarries = !!selectedRaiders?.some((r) => !!r.carries)
        this.everyHasMaxLevel = !!selectedRaiders?.every((r) => r.level >= r.stats.Levels)
        AllRaiderTrainings.forEach((training) => this.canDoTraining.set(training, GameState.getTrainingSites(training).length > 0 && selectedRaiders?.some((r) => !r.hasTraining(training))))
        AllRaiderTools.forEach((tool) => this.everyHasTool.set(tool, !!selectedRaiders?.every((r) => r.hasTool(tool))))
        this.buildingCanUpgrade = selectedBuilding?.canUpgrade()
        this.buildingCanSwitchPower = !selectedBuilding?.stats.SelfPowered && !selectedBuilding?.stats.PowerBuilding
    }

}

export class AirLevelChanged extends LocalEvent {

    airLevel: number

    constructor(airLevel: number) {
        super(EventKey.AIR_LEVEL_CHANGED)
        this.airLevel = airLevel
    }

}

export class ChangeCursor extends LocalEvent {

    cursor: Cursor
    timeout: number

    constructor(cursor: Cursor, timeout: number = null) {
        super(EventKey.CHANGE_CURSOR)
        this.cursor = cursor
        this.timeout = timeout
    }

}

export class SetupPriorityList extends LocalEvent {

    priorityList: PriorityEntry[]

    constructor(priorityList: PriorityEntry[]) {
        super(EventKey.SETUP_PRIORITY_LIST)
        this.priorityList = priorityList
    }

}

export class BuildingsChangedEvent extends LocalEvent {

    usableBuildingsByTypeAndLevel: Map<EntityType, Map<number, number>> = new Map()

    constructor() {
        super(EventKey.BUILDINGS_CHANGED)
        GameState.buildings.forEach((b) => {
            if (b.isUsable()) {
                const perLevel = this.usableBuildingsByTypeAndLevel.getOrUpdate(b.entityType, () => new Map())
                perLevel.set(b.level, perLevel.getOrUpdate(b.level, () => 0) + 1)
            }
        })
    }

    static countUsable(event: BuildingsChangedEvent, building: EntityType, minLevel: number = 0) {
        let result = 0
        event.usableBuildingsByTypeAndLevel.getOrUpdate(building, () => new Map()).forEach((count, level) => {
            if (level >= minLevel) result += count
        })
        return result
    }

}

export class RaidersChangedEvent extends LocalEvent {

    numRaiders: number
    training: RaiderTraining

    constructor(training: RaiderTraining = null) {
        super(EventKey.RAIDERS_CHANGED)
        this.numRaiders = GameState.raiders.length
        this.training = training
    }

}
