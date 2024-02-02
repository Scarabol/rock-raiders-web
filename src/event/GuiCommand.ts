import { EntityType } from '../game/model/EntityType'
import { PriorityEntry } from '../game/model/job/PriorityEntry'
import { RaiderTool } from '../game/model/raider/RaiderTool'
import { RaiderTraining } from '../game/model/raider/RaiderTraining'
import { EventKey } from './EventKeyEnum'
import { Cursor } from '../resource/Cursor'
import { Sample } from '../audio/Sample'
import { Raider } from '../game/model/raider/Raider'
import { BuildingSite } from '../game/model/building/BuildingSite'
import { VehicleUpgrade } from '../game/model/vehicle/VehicleUpgrade'
import { CameraRotation } from '../scene/BirdViewControls'
import { PositionComponent } from '../game/component/PositionComponent'
import { BaseEvent } from './EventTypeMap'

export class ChangeCursor extends BaseEvent {
    constructor(readonly cursor: Cursor, readonly timeout: number = null) {
        super(EventKey.COMMAND_CHANGE_CURSOR)
    }
}

export class ChangeTooltip extends BaseEvent {
    readonly numToolSlots?: number
    readonly tools?: RaiderTool[]
    readonly trainings?: RaiderTraining[]
    readonly crystals?: { actual: number, needed: number }
    readonly ores?: { actual: number, needed: number }
    readonly bricks?: { actual: number, needed: number }

    constructor(
        readonly tooltipText: string,
        readonly timeoutText: number,
        readonly tooltipSfx?: string,
        readonly timeoutSfx?: number,
        raider?: Raider,
        site?: BuildingSite,
        readonly buildingMissingOreForUpgrade?: number,
        readonly energy?: number,
    ) {
        super(EventKey.COMMAND_TOOLTIP_CHANGE)
        if (raider) {
            this.numToolSlots = raider.maxTools()
            this.tools = [...raider.tools]
            this.trainings = [...raider.trainings]
        }
        if (site) {
            this.crystals = {
                actual: site.onSiteByType.get(EntityType.CRYSTAL)?.length || 0,
                needed: site.neededByType.get(EntityType.CRYSTAL),
            }
            this.ores = {
                actual: site.onSiteByType.get(EntityType.ORE)?.length || 0,
                needed: site.neededByType.get(EntityType.ORE),
            }
            this.bricks = {
                actual: site.onSiteByType.get(EntityType.BRICK)?.length || 0,
                needed: site.neededByType.get(EntityType.BRICK),
            }
        }
    }
}

export class HideTooltip extends BaseEvent {
    constructor(readonly tooltipText: string, readonly tooltipSfx: string) {
        super(EventKey.COMMAND_TOOLTIP_HIDE)
    }
}

export class PlaySoundEvent extends BaseEvent {
    constructor(readonly sample: Sample, readonly isVoice: boolean) {
        super(EventKey.COMMAND_PLAY_SOUND)
    }
}

export class RemoveSelection extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_REMOVE_SELECTION)
    }
}

export class CancelBuildMode extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_CANCEL_BUILD_MODE)
    }
}

export class SelectBuildMode extends BaseEvent {
    entityType: EntityType

    constructor(entityType: EntityType) {
        super(EventKey.COMMAND_SELECT_BUILD_MODE)
        this.entityType = entityType
    }
}

export class PickTool extends BaseEvent {
    tool: RaiderTool

    constructor(tool: RaiderTool) {
        super(EventKey.COMMAND_PICK_TOOL)
        this.tool = tool
    }
}

export class CreatePowerPath extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_CREATE_POWER_PATH)
    }
}

export class PlaceFence extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_PLACE_FENCE)
    }
}

export class MakeRubble extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_MAKE_RUBBLE)
    }
}

export class ChangeRaiderSpawnRequest extends BaseEvent {
    increase: boolean

    constructor(increase: boolean) {
        super(EventKey.COMMAND_CHANGE_RAIDER_SPAWN_REQUEST)
        this.increase = increase
    }
}

export class CreateClearRubbleJob extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_CREATE_CLEAR_RUBBLE_JOB)
    }
}

export class UpgradeBuilding extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_UPGRADE_BUILDING)
    }
}

export class BeamUpBuilding extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_BUILDING_BEAMUP)
    }
}

export class BeamUpFence extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_FENCE_BEAMUP)
    }
}

export class ChangePriorityList extends BaseEvent {
    priorityList: PriorityEntry[]

    constructor(priorityList: PriorityEntry[]) {
        super(EventKey.COMMAND_CHANGE_PRIORITY_LIST)
        this.priorityList = priorityList
    }
}

export class ChangeBuildingPowerState extends BaseEvent {
    state: boolean

    constructor(state: boolean) {
        super(EventKey.COMMAND_CHANGE_BUILDING_POWER_STATE)
        this.state = state
    }
}

export class CreateDrillJob extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_CREATE_DRILL_JOB)
    }
}

export class CreateReinforceJob extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_CREATE_REINFORCE_JOB)
    }
}

export class CreateDynamiteJob extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_CREATE_DYNAMITE_JOB)
    }
}

export class CancelSurfaceJobs extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_CANCEL_SURFACE_JOBS)
    }
}

export class RaiderEat extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_RAIDER_EAT)
    }
}

export class RaiderDrop extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_RAIDER_DROP)
    }
}

export class RaiderUpgrade extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_RAIDER_UPGRADE)
    }
}

export class RaiderBeamUp extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_RAIDER_BEAMUP)
    }
}

export class TrainRaider extends BaseEvent {
    training: RaiderTraining

    constructor(training: RaiderTraining) {
        super(EventKey.COMMAND_TRAIN_RAIDER)
        this.training = training
    }
}

export class CancelBuilding extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_CANCEL_CONSTRUCTION)
    }
}

export class RequestVehicleSpawn extends BaseEvent {
    vehicle: EntityType
    numRequested: number

    constructor(vehicle: EntityType, numRequested: number) {
        super(EventKey.COMMAND_REQUEST_VEHICLE_SPAWN)
        this.vehicle = vehicle
        this.numRequested = numRequested
    }
}

export class VehicleCallMan extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_VEHICLE_GET_MAN)
    }
}

export class VehicleBeamUp extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_VEHICLE_BEAMUP)
    }
}

export class VehicleDriverGetOut extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_VEHICLE_DRIVER_GET_OUT)
    }
}

export class VehicleUnload extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_VEHICLE_UNLOAD)
    }
}

export class CameraControl extends BaseEvent {
    constructor(
        readonly zoom: number,
        readonly cycleBuilding: boolean,
        readonly rotationIndex: CameraRotation,
        readonly jumpToWorld: PositionComponent,
    ) {
        super(EventKey.COMMAND_CAMERA_CONTROL)
    }
}

export class RepairLava extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_REPAIR_LAVA)
    }
}

export class ChangePreferences extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_CHANGE_PREFERENCES)
    }
}

export class UpgradeVehicle extends BaseEvent {
    constructor(readonly upgrade: VehicleUpgrade) {
        super(EventKey.COMMAND_UPGRADE_VEHICLE)
    }
}

export class RepairBuilding extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_REPAIR_BUILDING)
    }
}

export class DropBirdScarer extends BaseEvent {
    constructor() {
        super(EventKey.COMMAND_DROP_BIRD_SCARER)
    }
}

export enum CameraViewMode {
    BIRD,
    FPV,
    SHOULDER,
}

export class ChangeCameraEvent extends BaseEvent {
    constructor(readonly viewMode: CameraViewMode) {
        super(EventKey.COMMAND_CAMERA_VIEW)
    }
}
