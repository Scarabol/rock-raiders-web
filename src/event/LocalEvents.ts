import { Vector3 } from 'three'
import { Sample } from '../audio/Sample'
import { EntityManager } from '../game/EntityManager'
import { EntityType } from '../game/model/EntityType'
import { PriorityEntry } from '../game/model/job/PriorityEntry'
import { Surface } from '../game/model/map/Surface'
import { SurfaceType } from '../game/model/map/SurfaceType'
import { Terrain } from '../game/model/map/Terrain'
import { AllRaiderTools, RaiderTool } from '../game/model/raider/RaiderTool'
import { AllRaiderTrainings, RaiderTraining } from '../game/model/raider/RaiderTraining'
import { MapSurfaceRect } from '../gui/radar/MapSurfaceRect'
import { TILESIZE } from '../params'
import { Cursor } from '../screen/Cursor'
import { EventKey } from './EventKeyEnum'
import { GameEvent } from './GameEvent'

export class LocalEvent extends GameEvent {

    constructor(eventKey: EventKey) {
        super(eventKey)
        this.isLocal = true
    }

}

export enum SelectPanelType {

    NONE,
    RAIDER,
    VEHICLE,
    BUILDING,
    SURFACE,

}

export class SelectionChanged extends LocalEvent {

    selectPanelType: SelectPanelType = SelectPanelType.NONE
    isGround: boolean
    isPowerPath: boolean
    canPlaceFence: boolean
    isFloor: boolean
    isSite: boolean
    hasRubble: boolean
    isDrillable: boolean
    isReinforcable: boolean
    someCarries: boolean
    everyHasMaxLevel: boolean
    canDoTraining: Map<RaiderTraining, boolean> = new Map()
    everyHasTool: Map<RaiderTool, boolean> = new Map()
    buildingCanUpgrade: boolean
    buildingCanSwitchPower: boolean
    buildingPowerSwitchState: boolean
    vehicleHasCallManJob: boolean
    allVehicleEmpty: boolean

    constructor(entityMgr: EntityManager) {
        super(EventKey.SELECTION_CHANGED)
        if (!entityMgr) return
        this.selectPanelType = entityMgr.selection.getSelectPanelType()
        this.isGround = entityMgr.selection.surface?.surfaceType === SurfaceType.GROUND
        this.isPowerPath = entityMgr.selection.surface?.surfaceType === SurfaceType.POWER_PATH
        this.isFloor = entityMgr.selection.surface?.surfaceType.floor
        this.isSite = entityMgr.selection.surface?.surfaceType === SurfaceType.POWER_PATH_CONSTRUCTION || entityMgr.selection.surface?.surfaceType === SurfaceType.POWER_PATH_BUILDING_SITE
        this.hasRubble = entityMgr.selection.surface?.hasRubble()
        this.isDrillable = entityMgr.selection.surface?.isDigable()
        this.isReinforcable = entityMgr.selection.surface?.isReinforcable()
        this.canPlaceFence = entityMgr.selection.surface?.canPlaceFence() && entityMgr.buildings.some((b) => b.entityType === EntityType.POWER_STATION && b.isPowered())
        this.someCarries = !!entityMgr.selection.raiders.some((r) => !!r.carries)
        this.everyHasMaxLevel = !!entityMgr.selection.raiders.every((r) => r.level >= r.stats.Levels)
        AllRaiderTrainings.forEach((training) => this.canDoTraining.set(training, entityMgr.getTrainingSites(training).length > 0 && entityMgr.selection.raiders.some((r) => !r.hasTraining(training))))
        AllRaiderTools.forEach((tool) => this.everyHasTool.set(tool, !!entityMgr.selection.raiders.every((r) => r.hasTool(tool))))
        this.buildingCanUpgrade = entityMgr.selection.building?.canUpgrade()
        this.buildingCanSwitchPower = !entityMgr.selection.building?.stats.SelfPowered && !entityMgr.selection.building?.stats.PowerBuilding
        this.buildingPowerSwitchState = entityMgr.selection.building?.powerSwitch
        this.vehicleHasCallManJob = entityMgr.selection.vehicles.every((v) => !!v.callManJob)
        this.allVehicleEmpty = entityMgr.selection.vehicles.every((v) => !v.driver)
    }

}

export class DeselectAll extends SelectionChanged {

    constructor() {
        super(null)
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

    discoveredBuildingsByTypeAndLevel: Map<EntityType, Map<number, number>> = new Map()
    usableBuildingsByTypeAndLevel: Map<EntityType, Map<number, number>> = new Map()

    constructor(entityMgr: EntityManager) {
        super(EventKey.BUILDINGS_CHANGED)
        entityMgr.buildings.forEach((b) => {
            if (b.isReady()) {
                const perLevel = this.discoveredBuildingsByTypeAndLevel.getOrUpdate(b.entityType, () => new Map())
                perLevel.set(b.level, perLevel.getOrUpdate(b.level, () => 0) + 1)
            }
            if (b.isPowered()) {
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

    constructor(entityMgr: EntityManager, training: RaiderTraining = null) {
        super(EventKey.RAIDERS_CHANGED)
        this.numRaiders = entityMgr.raiders.length
        this.training = training
    }

}

export class VehiclesChangedEvent extends LocalEvent {

    constructor() {
        super(EventKey.VEHICLES_CHANGED)
    }

}

export class PlaySoundEvent extends LocalEvent {

    sample: Sample

    constructor(sample: Sample) {
        super(EventKey.PLAY_SOUND)
        this.sample = sample
    }

}

export class UpdateRadarTerrain extends LocalEvent {

    surfaces: MapSurfaceRect[] = []
    tileX: number
    tileY: number

    constructor(terrain: Terrain, mapFocus: Vector3) {
        super(EventKey.UPDATE_RADAR_TERRAIN)
        terrain.forEachSurface((s) => {
            if (s.discovered) {
                this.surfaces.push(new MapSurfaceRect(s))
            }
        })
        this.tileX = Math.floor(mapFocus.x / TILESIZE)
        this.tileY = Math.floor(mapFocus.z / TILESIZE)
    }

}

export class UpdateRadarSurface extends LocalEvent {

    surfaceRect: MapSurfaceRect

    constructor(surface: Surface) {
        super(EventKey.UPDATE_RADAR_SURFACE)
        this.surfaceRect = new MapSurfaceRect(surface)
    }

}

export class UpdatePriorities extends LocalEvent {

    priorityList: PriorityEntry[]

    constructor(priorityList: PriorityEntry[]) {
        super(EventKey.UPDATE_PRIORITIES)
        this.priorityList = priorityList
    }

}
