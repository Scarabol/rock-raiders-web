import { Vector3 } from 'three'
import { MapMarkerChange, MapMarkerType } from '../game/component/MapMarkerComponent'
import { EntityManager } from '../game/EntityManager'
import { EntityType } from '../game/model/EntityType'
import { Surface } from '../game/terrain/Surface'
import { SurfaceType } from '../game/terrain/SurfaceType'
import { Terrain } from '../game/terrain/Terrain'
import { RaiderTool, RaiderTools } from '../game/model/raider/RaiderTool'
import { RaiderTraining, RaiderTrainings } from '../game/model/raider/RaiderTraining'
import { MapSurfaceRect } from '../gui/radar/MapSurfaceRect'
import { TILESIZE } from '../params'
import { EventKey } from './EventKeyEnum'
import { VehicleUpgrade, VehicleUpgrades } from '../game/model/vehicle/VehicleUpgrade'
import { GameResult } from '../game/model/GameResult'
import { GameEntity } from '../game/ECS'
import { HealthComponent } from '../game/component/HealthComponent'
import { Rect } from '../core/Rect'
import { BaseEvent } from './EventTypeMap'

export enum SelectPanelType {
    NONE,
    RAIDER,
    VEHICLE,
    BUILDING,
    SURFACE,
    FENCE,
}

export class SelectionChanged extends BaseEvent {
    selectPanelType: SelectPanelType = SelectPanelType.NONE
    isGround: boolean
    isPowerPath: boolean
    canPlaceFence: boolean
    isFloor: boolean
    isSite: boolean
    hasErosion: boolean
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
    buildingNeedsRepair: boolean
    buildingCanSwitchPower: boolean
    buildingPowerSwitchState: boolean
    vehicleHasCallManJob: boolean
    noVehicleWithDriver: boolean
    vehicleWithCarried: boolean
    someHasBirdScarer: boolean
    someVehicleCanLoad: boolean

    constructor(entityMgr: EntityManager) {
        super(EventKey.SELECTION_CHANGED)
        this.selectPanelType = entityMgr.selection.getSelectPanelType()
        this.isGround = entityMgr.selection.surface?.surfaceType === SurfaceType.GROUND
        this.isPowerPath = entityMgr.selection.surface?.surfaceType === SurfaceType.POWER_PATH
        this.isFloor = entityMgr.selection.surface?.surfaceType.floor
        this.isSite = !!entityMgr.selection.surface?.site
        this.hasErosion = entityMgr.selection.surface?.surfaceType.hasErosion
        this.hasRepairLava = !!entityMgr.selection.surface?.site
        this.hasRubble = entityMgr.selection.surface?.hasRubble()
        this.isDrillable = entityMgr.selection.surface?.isDigable() && (entityMgr.selection.surface?.surfaceType !== SurfaceType.HARD_ROCK || entityMgr.vehicles.some((v) => v.canDrill(entityMgr.selection.surface)))
        this.isReinforcable = entityMgr.selection.surface?.isReinforcable()
        this.canPlaceFence = entityMgr.selection.surface?.canPlaceFence()
        this.someCarries = !!entityMgr.selection.raiders.some((r) => !!r.carries)
        this.everyHasMaxLevel = !!entityMgr.selection.raiders.every((r) => r.level >= r.stats.Levels)
        RaiderTrainings.values.forEach((training) => this.canDoTraining.set(training, entityMgr.hasTrainingSite(training) && entityMgr.selection.raiders.some((r) => !r.hasTraining(training))))
        RaiderTools.values.forEach((tool) => this.everyHasTool.set(tool, !!entityMgr.selection.raiders.every((r) => r.hasTool(tool))))
        VehicleUpgrades.values.forEach((upgrade) => this.canInstallUpgrade.set(upgrade, entityMgr.selection.vehicles.some((v) => v.canUpgrade(upgrade))))
        this.hasUpgradeSite = entityMgr.hasUpgradeSite()
        this.buildingCanUpgrade = entityMgr.selection.building?.canUpgrade()
        this.buildingMissingOreForUpgrade = entityMgr.selection.building?.missingOreForUpgrade()
        const buildingEntity = entityMgr.selection.building?.entity
        const buildingHealthComponent = buildingEntity ? entityMgr.worldMgr.ecs.getComponents(buildingEntity)?.get(HealthComponent) : null
        this.buildingNeedsRepair = buildingHealthComponent ? buildingHealthComponent.health < buildingHealthComponent.maxHealth : false
        this.buildingCanSwitchPower = !entityMgr.selection.building?.stats.SelfPowered && !entityMgr.selection.building?.stats.PowerBuilding && (entityMgr.selection.building?.energized || entityMgr.selection.building?.surfaces.some((s) => s.energized))
        this.buildingPowerSwitchState = entityMgr.selection.building?.powerSwitch
        this.vehicleHasCallManJob = entityMgr.selection.vehicles.every((v) => !!v.callManJob)
        this.noVehicleWithDriver = entityMgr.selection.vehicles.every((v) => !v.driver)
        this.vehicleWithCarried = entityMgr.selection.vehicles.some((v) => v.carriedItems.size > 0 || (!v.portering && !!v.carriedVehicle))
        this.someHasBirdScarer = entityMgr.selection.raiders.some((r) => r.hasTool(RaiderTool.BIRDSCARER))
        this.someVehicleCanLoad = entityMgr.selection.vehicles.some((v) => v.canLoad())
    }
}

export class DeselectAll extends BaseEvent {
    constructor() {
        super(EventKey.DESELECT_ALL)
    }
}

export class BuildingsChangedEvent extends BaseEvent {
    readonly placedVisibleBuildings: Set<GameEntity> = new Set()
    readonly poweredBuildings: Set<GameEntity> = new Set()
    readonly discoveredBuildingsMaxLevel: Map<EntityType, number> = new Map()
    readonly usableBuildingsMaxLevel: Map<EntityType, number> = new Map()

    constructor(entityMgr: EntityManager) {
        super(EventKey.BUILDINGS_CHANGED)
        entityMgr.buildings.forEach((b) => {
            if (b.isReady()) {
                this.placedVisibleBuildings.add(b.entity)
                const current = this.discoveredBuildingsMaxLevel.getOrDefault(b.entityType, 0)
                this.discoveredBuildingsMaxLevel.set(b.entityType, Math.max(current, b.level))
            }
            if (b.isPowered()) {
                this.poweredBuildings.add(b.entity)
                const current = this.usableBuildingsMaxLevel.getOrDefault(b.entityType, 0)
                this.usableBuildingsMaxLevel.set(b.entityType, Math.max(current, b.level))
            }
        })
    }

    // needs static, because events might get de-/serialized, which removes class methods
    static hasUsable(event: BuildingsChangedEvent, building: EntityType, minLevel: number = 0): boolean {
        const currentMaxLevel = event.usableBuildingsMaxLevel.getOrDefault(building, -1)
        return currentMaxLevel >= minLevel
    }
}

export class RaidersAmountChangedEvent extends BaseEvent {
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

export class RaiderTrainingCompleteEvent extends BaseEvent {
    constructor(readonly training: RaiderTraining) {
        super(EventKey.RAIDER_TRAINING_COMPLETE)
    }
}

export class VehicleUpgradeCompleteEvent extends BaseEvent {
    constructor() {
        super(EventKey.VEHICLE_UPGRADE_COMPLETE)
    }
}

export class InitRadarMap extends BaseEvent {
    focusTile: { x: number, y: number } = null
    surfaces: MapSurfaceRect[] = []
    terrainWidth: number
    terrainHeight: number

    constructor(mapFocus: Vector3, terrain: Terrain) {
        super(EventKey.INIT_RADAR_MAP)
        this.focusTile = {x: Math.floor(mapFocus.x / TILESIZE), y: Math.floor(mapFocus.z / TILESIZE)}
        terrain.forEachSurface((s) => {
            if (s.discovered || s.scanned) this.surfaces.push(new MapSurfaceRect(s))
        })
        this.terrainWidth = terrain.width
        this.terrainHeight = terrain.height
    }
}

export class UpdateRadarTerrain extends BaseEvent {
    surfaces: MapSurfaceRect[] = []
    terrainWidth: number
    terrainHeight: number

    constructor(terrain: Terrain) {
        super(EventKey.UPDATE_RADAR_TERRAIN)
        terrain.forEachSurface((s) => {
            if (s.discovered || s.scanned) this.surfaces.push(new MapSurfaceRect(s))
        })
        this.terrainWidth = terrain.width
        this.terrainHeight = terrain.height
    }
}

export class UpdateRadarSurface extends BaseEvent {
    surfaceRect: MapSurfaceRect

    constructor(surface: Surface) {
        super(EventKey.UPDATE_RADAR_SURFACE)
        this.surfaceRect = new MapSurfaceRect(surface)
    }
}

export class UpdateRadarEntityEvent extends BaseEvent {
    constructor(readonly mapMarkerType: MapMarkerType, readonly entity: GameEntity, readonly change: MapMarkerChange, readonly position?: { x: number, z: number }, readonly radius?: number) {
        super(EventKey.UPDATE_RADAR_ENTITY)
    }
}

export class ShowMissionBriefingEvent extends BaseEvent {
    constructor(readonly isShowing: boolean) {
        super(EventKey.SHOW_MISSION_BRIEFING)
    }
}

export class ShowMissionAdvisorEvent extends BaseEvent {
    constructor(readonly showAdvisor: boolean) {
        super(EventKey.SHOW_MISSION_ADVISOR)
    }
}

export class ShowGameResultEvent extends BaseEvent {
    constructor(readonly result?: GameResult) {
        super(EventKey.SHOW_GAME_RESULT)
    }
}

export class ShowOptionsEvent extends BaseEvent {
    constructor() {
        super(EventKey.SHOW_OPTIONS)
    }
}

export class SetSpaceToContinueEvent extends BaseEvent {
    constructor(readonly state: boolean) {
        super(EventKey.SET_SPACE_TO_CONTINUE)
    }
}

export class FollowerSetCanvasEvent extends BaseEvent {
    constructor(readonly canvas: HTMLCanvasElement) {
        super(EventKey.FOLLOWER_SET_CANVAS)
    }
}

export class FollowerSetLookAtEvent extends BaseEvent {
    constructor(readonly entity: GameEntity) {
        super(EventKey.FOLLOWER_SET_LOOK_AT)
    }
}

export class SelectionFrameChangeEvent extends BaseEvent {
    constructor(readonly rect: Rect) {
        super(EventKey.SELECTION_FRAME_CHANGE)
    }
}

export class GuiButtonBlinkEvent extends BaseEvent {
    constructor(readonly buttonType: string, readonly blinking: boolean) {
        super(EventKey.GUI_BUTTON_BLINK)
    }
}

export class GuiGoBackButtonClicked extends BaseEvent {
    constructor() {
        super(EventKey.GUI_GO_BACK_BUTTON_CLICKED)
    }
}
