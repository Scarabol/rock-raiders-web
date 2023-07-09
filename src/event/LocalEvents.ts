import { Vector3 } from 'three'
import { MapMarkerChange, MapMarkerType } from '../game/component/MapMarkerComponent'
import { EntityManager } from '../game/EntityManager'
import { EntityType } from '../game/model/EntityType'
import { PriorityEntry } from '../game/model/job/PriorityEntry'
import { Surface } from '../game/terrain/Surface'
import { SurfaceType } from '../game/terrain/SurfaceType'
import { Terrain } from '../game/terrain/Terrain'
import { RaiderTool, RaiderTools } from '../game/model/raider/RaiderTool'
import { RaiderTraining, RaiderTrainings } from '../game/model/raider/RaiderTraining'
import { MapSurfaceRect } from '../gui/radar/MapSurfaceRect'
import { TILESIZE } from '../params'
import { EventKey } from './EventKeyEnum'
import { GameEvent } from './GameEvent'
import { VehicleUpgrade, VehicleUpgrades } from '../game/model/vehicle/VehicleUpgrade'
import { GameResult } from '../game/model/GameResult'
import { GameEntity } from '../game/ECS'

export class LocalEvent extends GameEvent {
}

export enum SelectPanelType {
    NONE,
    RAIDER,
    VEHICLE,
    BUILDING,
    SURFACE,
    FENCE,
}

export class SelectionChanged extends LocalEvent {
    selectPanelType: SelectPanelType = SelectPanelType.NONE
    isGround: boolean
    isPowerPath: boolean
    canPlaceFence: boolean
    isFloor: boolean
    isSite: boolean
    isLava: boolean
    hasRepairLava: boolean
    hasRubble: boolean
    isDrillable: boolean
    isReinforcable: boolean
    someCarries: boolean
    everyHasMaxLevel: boolean
    canDoTraining: Map<RaiderTraining, boolean> = new Map()
    canInstallUpgrade: Map<VehicleUpgrade, boolean> = new Map()
    hasUpgradeSite: boolean
    everyHasTool: Map<RaiderTool, boolean> = new Map()
    buildingCanUpgrade: boolean
    buildingMissingOreForUpgrade: number
    buildingCanSwitchPower: boolean
    buildingPowerSwitchState: boolean
    vehicleHasCallManJob: boolean
    noVehicleWithDriver: boolean
    vehicleWithCarriedItems: boolean

    constructor(entityMgr: EntityManager) {
        super(EventKey.SELECTION_CHANGED)
        this.selectPanelType = entityMgr.selection.getSelectPanelType()
        this.isGround = entityMgr.selection.surface?.surfaceType === SurfaceType.GROUND
        this.isPowerPath = entityMgr.selection.surface?.surfaceType === SurfaceType.POWER_PATH
        this.isFloor = entityMgr.selection.surface?.surfaceType.floor
        this.isSite = !!entityMgr.selection.surface?.site
        this.isLava = [SurfaceType.LAVA1, SurfaceType.LAVA2, SurfaceType.LAVA3, SurfaceType.LAVA4].includes(entityMgr.selection.surface?.surfaceType)
        this.hasRepairLava = !!entityMgr.selection.surface?.site
        this.hasRubble = entityMgr.selection.surface?.hasRubble()
        this.isDrillable = entityMgr.selection.surface?.isDigable() && (entityMgr.selection.surface?.surfaceType !== SurfaceType.HARD_ROCK || entityMgr.vehicles.some((v) => v.canDrill(entityMgr.selection.surface)))
        this.isReinforcable = entityMgr.selection.surface?.isReinforcable()
        this.canPlaceFence = entityMgr.selection.surface?.canPlaceFence() && entityMgr.buildings.some((b) => b.entityType === EntityType.POWER_STATION && b.isReady())
        this.someCarries = !!entityMgr.selection.raiders.some((r) => !!r.carries)
        this.everyHasMaxLevel = !!entityMgr.selection.raiders.every((r) => r.level >= r.stats.Levels)
        RaiderTrainings.values.forEach((training) => this.canDoTraining.set(training, entityMgr.hasTrainingSite(training) && entityMgr.selection.raiders.some((r) => !r.hasTraining(training))))
        RaiderTools.values.forEach((tool) => this.everyHasTool.set(tool, !!entityMgr.selection.raiders.every((r) => r.hasTool(tool))))
        VehicleUpgrades.values.forEach((upgrade) => this.canInstallUpgrade.set(upgrade, entityMgr.selection.vehicles.some((v) => v.canUpgrade(upgrade))))
        this.hasUpgradeSite = entityMgr.hasUpgradeSite()
        this.buildingCanUpgrade = entityMgr.selection.building?.canUpgrade()
        this.buildingMissingOreForUpgrade = entityMgr.selection.building?.missingOreForUpgrade()
        this.buildingCanSwitchPower = !entityMgr.selection.building?.stats.SelfPowered && !entityMgr.selection.building?.stats.PowerBuilding && (entityMgr.selection.building?.energized || entityMgr.selection.building?.surfaces.some((s) => s.energized))
        this.buildingPowerSwitchState = entityMgr.selection.building?.powerSwitch
        this.vehicleHasCallManJob = entityMgr.selection.vehicles.every((v) => !!v.callManJob)
        this.noVehicleWithDriver = entityMgr.selection.vehicles.every((v) => !v.driver)
        this.vehicleWithCarriedItems = entityMgr.selection.vehicles.some((v) => v.carriedItems.size > 0)
    }
}

export class DeselectAll extends LocalEvent {
    constructor() {
        super(EventKey.DESELECT_ALL)
    }
}

export class SaveScreenshot extends LocalEvent {
    constructor() {
        super(EventKey.SAVE_SCREENSHOT)
    }
}

export class AirLevelChanged extends LocalEvent {
    airLevel: number

    constructor(airLevel: number) {
        super(EventKey.AIR_LEVEL_CHANGED)
        this.airLevel = airLevel
    }
}

export class NerpMessage extends LocalEvent {
    text: string

    constructor(text: string) {
        super(EventKey.NERP_MESSAGE)
        this.text = text
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
    discoveredBuildingsMaxLevel: Map<EntityType, number> = new Map()
    usableBuildingsMaxLevel: Map<EntityType, number> = new Map()

    constructor(entityMgr: EntityManager) {
        super(EventKey.BUILDINGS_CHANGED)
        entityMgr.buildings.forEach((b) => {
            if (b.isReady()) {
                const level = this.discoveredBuildingsMaxLevel.get(b.entityType) || b.level
                this.discoveredBuildingsMaxLevel.set(b.entityType, level)
            }
            if (b.isPowered()) {
                const level = this.usableBuildingsMaxLevel.get(b.entityType) || b.level
                this.usableBuildingsMaxLevel.set(b.entityType, level)
            }
        })
    }

    // needs static, because events might get de-/serialized, which removes class methods
    static hasUsable(event: BuildingsChangedEvent, building: EntityType, minLevel: number = 0): boolean {
        const currentMaxLevel = event.usableBuildingsMaxLevel.getOrDefault(building, -1)
        return currentMaxLevel >= minLevel
    }
}

export class RaidersAmountChangedEvent extends LocalEvent {
    hasRaider: boolean
    hasMaxRaiders: boolean
    hasDemolition: boolean

    constructor(entityMgr: EntityManager) {
        super(EventKey.RAIDER_AMOUNT_CHANGED)
        this.hasRaider = entityMgr.raiders.length > 0
        this.hasMaxRaiders = entityMgr.hasMaxRaiders()
        this.hasDemolition = entityMgr.hasProfessional(RaiderTraining.DEMOLITION)
    }
}

export class RaiderTrainingCompleteEvent extends LocalEvent {
    constructor(readonly training: RaiderTraining) {
        super(EventKey.RAIDER_TRAINING_COMPLETE)
    }
}

export class UpgradeVehicleCompleteEvent extends LocalEvent {
    constructor() {
        super(EventKey.VEHICLE_UPGRADE_COMPLETE)
    }
}

export class UpdateRadarTerrain extends LocalEvent {
    surfaces: MapSurfaceRect[] = []
    focusTile: { x: number, y: number } = null

    constructor(terrain: Terrain, mapFocus: Vector3) {
        super(EventKey.UPDATE_RADAR_TERRAIN)
        terrain.forEachSurface((s) => {
            if (s.discovered) {
                this.surfaces.push(new MapSurfaceRect(s))
            }
        })
        if (mapFocus) this.focusTile = {x: Math.floor(mapFocus.x / TILESIZE), y: Math.floor(mapFocus.z / TILESIZE)}
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

export class UpdateRadarEntities extends LocalEvent {
    entitiesByOrder: Map<MapMarkerType, Map<GameEntity, { x: number, z: number }>> = new Map() // no Vectors, because of serialization

    constructor(entityMgr: EntityManager) {
        super(EventKey.UPDATE_RADAR_LEGACY_ENTITIES)
        const entities = new Map()
        entityMgr.raiders.forEach((r) => {
            const position = r.getPosition()
            return entities.set(r.entity, {x: position.x, z: position.z})
        })
        entityMgr.vehicles.forEach((v) => {
            const position = v.getPosition()
            return entities.set(v.entity, {x: position.x, z: position.z})
        })
        this.entitiesByOrder.set(MapMarkerType.DEFAULT, entities)
        const materials = new Map()
        const tmpWorldPosition = new Vector3()
        entityMgr.materials.forEach((m) => {
            if (m.entityType !== EntityType.BARRIER) {
                m.sceneEntity.getWorldPosition(tmpWorldPosition)
                materials.set(m.entity, {x: tmpWorldPosition.x, z: tmpWorldPosition.z})
            }
        })
        this.entitiesByOrder.set(MapMarkerType.MATERIAL, materials)
    }
}

export class UpdateRadarEntityEvent extends LocalEvent {
    constructor(readonly mapMarkerType: MapMarkerType, readonly entity: GameEntity, readonly change: MapMarkerChange, readonly position: { x: number, z: number }) {
        super(EventKey.UPDATE_RADAR_ENTITY)
    }
}

export class ShowMissionBriefingEvent extends LocalEvent {
    constructor(readonly isShowing: boolean) {
        super(EventKey.SHOW_MISSION_BRIEFING)
    }
}

export class ShowGameResultEvent extends LocalEvent {
    constructor(readonly result?: GameResult) {
        super(EventKey.SHOW_GAME_RESULT)
        this.guiForward = false
    }
}

export class ShowOptionsEvent extends LocalEvent {
    constructor() {
        super(EventKey.SHOW_OPTIONS)
    }
}

export class SetSpaceToContinueEvent extends LocalEvent {
    constructor(readonly state: boolean) {
        super(EventKey.SET_SPACE_TO_CONTINUE)
    }
}
