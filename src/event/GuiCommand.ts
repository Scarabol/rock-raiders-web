import { EntityType } from '../game/model/EntityType'
import { PriorityEntry } from '../game/model/job/PriorityEntry'
import { RaiderTool } from '../game/model/raider/RaiderTool'
import { RaiderTraining } from '../game/model/raider/RaiderTraining'
import { EventKey } from './EventKeyEnum'
import { GameEvent } from './GameEvent'
import { Cursor } from '../cfg/PointerCfg'
import { Sample } from '../audio/Sample'
import { SaveGamePreferences } from '../resource/SaveGameManager'

export class GuiCommand extends GameEvent {
}

export class ChangeCursor extends GuiCommand {
    cursor: Cursor
    timeout: number

    constructor(cursor: Cursor, timeout: number = null) {
        super(EventKey.COMMAND_CHANGE_CURSOR)
        this.cursor = cursor
        this.timeout = timeout
    }
}

export class ChangeTooltip extends GuiCommand {
    constructor(readonly tooltipText: string, readonly tooltipSfx?: string) {
        super(EventKey.COMMAND_CHANGE_TOOLTIP)
    }
}

export class PlaySoundEvent extends GuiCommand {
    sample: Sample

    constructor(sample: Sample) {
        super(EventKey.COMMAND_PLAY_SOUND)
        this.sample = sample
    }
}

export class RemoveSelection extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_REMOVE_SELECTION)
    }
}

export class CancelBuildMode extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_CANCEL_BUILD_MODE)
    }
}

export class SelectBuildMode extends GuiCommand {
    entityType: EntityType

    constructor(entityType: EntityType) {
        super(EventKey.COMMAND_SELECT_BUILD_MODE)
        this.entityType = entityType
    }
}

export class SelectedRaiderPickTool extends GuiCommand {
    tool: RaiderTool

    constructor(tool: RaiderTool) {
        super(EventKey.COMMAND_PICK_TOOL)
        this.tool = tool
    }
}

export class CreatePowerPath extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_CREATE_POWER_PATH)
    }
}

export class PlaceFence extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_PLACE_FENCE)
    }
}

export class MakeRubble extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_MAKE_RUBBLE)
    }
}

export class ChangeRaiderSpawnRequest extends GuiCommand {
    increase: boolean

    constructor(increase: boolean) {
        super(EventKey.COMMAND_CHANGE_RAIDER_SPAWN_REQUEST)
        this.increase = increase
    }
}

export class CreateClearRubbleJob extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_CREATE_CLEAR_RUBBLE_JOB)
    }
}

export class UpgradeBuilding extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_UPGRADE_BUILDING)
    }
}

export class BeamUpBuilding extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_BUILDING_BEAMUP)
    }
}

export class BeamUpFence extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_FENCE_BEAMUP)
    }
}

export class ChangePriorityList extends GuiCommand {
    priorityList: PriorityEntry[]

    constructor(priorityList: PriorityEntry[]) {
        super(EventKey.COMMAND_CHANGE_PRIORITY_LIST)
        this.priorityList = priorityList
    }
}

export class ChangeBuildingPowerState extends GuiCommand {
    state: boolean

    constructor(state: boolean) {
        super(EventKey.COMMAND_CHANGE_BUILDING_POWER_STATE)
        this.state = state
    }
}

export class CreateDrillJob extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_CREATE_DRILL_JOB)
    }
}

export class CreateReinforceJob extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_CREATE_REINFORCE_JOB)
    }
}

export class CreateDynamiteJob extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_CREATE_DYNAMITE_JOB)
    }
}

export class CancelSurfaceJobs extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_CANCEL_SURFACE_JOBS)
    }
}

export class RaiderEat extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_RAIDER_EAT)
    }
}

export class RaiderDrop extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_RAIDER_DROP)
    }
}

export class RaiderUpgrade extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_RAIDER_UPGRADE)
    }
}

export class RaiderBeamUp extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_RAIDER_BEAMUP)
    }
}

export class TrainRaider extends GuiCommand {
    training: RaiderTraining

    constructor(training: RaiderTraining) {
        super(EventKey.COMMAND_TRAIN_RAIDER)
        this.training = training
    }
}

export class CancelBuilding extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_CANCEL_CONSTRUCTION)
    }
}

export class RequestVehicleSpawn extends GuiCommand {
    vehicle: EntityType
    numRequested: number

    constructor(vehicle: EntityType, numRequested: number) {
        super(EventKey.COMMAND_REQUEST_VEHICLE_SPAWN)
        this.vehicle = vehicle
        this.numRequested = numRequested
    }
}

export class VehicleCallMan extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_VEHICLE_GET_MAN)
    }
}

export class VehicleBeamUp extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_VEHICLE_BEAMUP)
    }
}

export class VehicleDriverGetOut extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_VEHICLE_DRIVER_GET_OUT)
    }
}

export class VehicleUnload extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_VEHICLE_UNLOAD)
    }
}

export class CameraControl extends GuiCommand {
    constructor(
        readonly zoom: number,
        readonly cycleBuilding: boolean,
        readonly rotationIndex: number,
        readonly jumpToWorld: { x: number, y: number, z: number },
    ) {
        super(EventKey.COMMAND_CAMERA_CONTROL)
    }
}

export class RepairLava extends GuiCommand {
    constructor() {
        super(EventKey.COMMAND_REPAIR_LAVA)
    }
}

export class ChangePreferences extends GuiCommand {
    constructor(readonly preferences: SaveGamePreferences) {
        super(EventKey.COMMAND_CHANGE_PREFERENCES)
    }
}
