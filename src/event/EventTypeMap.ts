import { BuildingsChangedEvent, DeselectAll, FollowerSetCanvasEvent, FollowerSetLookAtEvent, InitRadarMap, RaidersAmountChangedEvent, RaiderTrainingCompleteEvent, SaveScreenshot, SelectionChanged, SelectionFrameChangeEvent, SetSpaceToContinueEvent, ShowGameResultEvent, ShowMissionBriefingEvent, ShowOptionsEvent, UpdateRadarEntityEvent, UpdateRadarSurface, UpdateRadarTerrain, VehicleUpgradeCompleteEvent } from './LocalEvents'
import { AirLevelChanged, CavernDiscovered, DynamiteExplosionEvent, GameResultEvent, JobCreateEvent, LevelSelectedEvent, MaterialAmountChanged, NerpMessageEvent, OreFoundEvent, RequestedRaidersChanged, RequestedVehiclesChanged, RestartGameEvent, SetupPriorityList, ToggleAlarmEvent, UpdatePriorities, UsedCrystalsChanged } from './WorldEvents'
import { CameraControl, CancelBuilding, CancelBuildMode, CancelSurfaceJobs, ChangeBuildingPowerState, ChangeCameraEvent, ChangeCursor, ChangePreferences, ChangePriorityList, ChangeRaiderSpawnRequest, ChangeTooltip, CreateClearRubbleJob, CreateDrillJob, CreateDynamiteJob, CreatePowerPath, CreateReinforceJob, DropBirdScarer, HideTooltip, MakeRubble, PickTool, PlaceFence, PlaySoundEvent, RaiderBeamUp, RaiderDrop, RaiderEat, RaiderUpgrade, RemoveSelection, RepairBuilding, RepairLava, RequestVehicleSpawn, SelectBuildMode, TrainRaider, UpgradeBuilding, UpgradeVehicle, VehicleBeamUp, VehicleCallMan, VehicleDriverGetOut, VehicleUnload } from './GuiCommand'
import { CrystalFoundEvent, GenericDeathEvent, GenericMonsterEvent, LandslideEvent, PowerDrainEvent, RaiderDiscoveredEvent, SlugEmergeEvent, UnderAttackEvent, WorldLocationEvent } from './WorldLocationEvent'

export class BaseEvent {
    constructor(readonly type: keyof EventTypeMap) {
    }
}

export interface DefaultEventMap {
    'selection-changed': SelectionChanged
    'deselect-all': DeselectAll
    'buildings-changed': BuildingsChangedEvent
    'raider-amount-changed': RaidersAmountChangedEvent
    'raider-training-complete': RaiderTrainingCompleteEvent
    'vehicle-upgrade-complete': VehicleUpgradeCompleteEvent
    'show-mission-briefing': ShowMissionBriefingEvent
    'show-game-result': ShowGameResultEvent
    'show-options': ShowOptionsEvent
    'set-space-to-continue': SetSpaceToContinueEvent
    'follower-set-canvas': FollowerSetCanvasEvent
    'follower-set-look-at': FollowerSetLookAtEvent
    'follower-render-start': BaseEvent
    'follower-render-stop': BaseEvent
    'selection-frame-change': SelectionFrameChangeEvent
    'save-screenshot': SaveScreenshot
    'init-radar-map': InitRadarMap
    'update-radar-entity': UpdateRadarEntityEvent
    'update-radar-terrain': UpdateRadarTerrain
    'update-radar-surface': UpdateRadarSurface

    'command-change-cursor': ChangeCursor
    'command-tooltip-change': ChangeTooltip
    'command-tooltip-hide': HideTooltip
    'command-play-sound': PlaySoundEvent
    'command-remove-selection': RemoveSelection
    'command-change-raider-spawn-request': ChangeRaiderSpawnRequest
    'command-create-power-path': CreatePowerPath
    'command-place-fence': PlaceFence
    'command-fence-beamup': BaseEvent
    'command-make-rubble': MakeRubble
    'command-create-clear-rubble-job': CreateClearRubbleJob
    'command-create-drill-job': CreateDrillJob
    'command-create-reinforce-job': CreateReinforceJob
    'command-create-dynamite-job': CreateDynamiteJob
    'command-cancel-surface-jobs': CancelSurfaceJobs
    'command-change-building-power-state': ChangeBuildingPowerState
    'command-upgrade-building': UpgradeBuilding
    'command-building-beamup': BaseEvent
    'command-raider-eat': RaiderEat
    'command-pick-tool': PickTool
    'command-raider-upgrade': RaiderUpgrade
    'command-raider-beamup': RaiderBeamUp
    'command-train-raider': TrainRaider
    'command-raider-drop': RaiderDrop
    'command-select-build-mode': SelectBuildMode
    'command-cancel-build-mode': CancelBuildMode
    'command-cancel-construction': CancelBuilding
    'command-request-vehicle-spawn': RequestVehicleSpawn
    'command-vehicle-get-man': VehicleCallMan
    'command-vehicle-beamup': VehicleBeamUp
    'command-vehicle-driver-get-out': VehicleDriverGetOut
    'command-vehicle-unload': VehicleUnload
    'command-change-priority-list': ChangePriorityList
    'command-camera-control': CameraControl
    'command-repair-lava': RepairLava
    'command-change-preferences': ChangePreferences
    'command-upgrade-vehicle': UpgradeVehicle
    'command-repair-building': RepairBuilding
    'command-drop-bird-scarer': DropBirdScarer
    'command-camera-view': ChangeCameraEvent

    'level-selected': LevelSelectedEvent
    'job-create': JobCreateEvent
    'requested-raiders-changed': RequestedRaidersChanged
    'requested-vehicles-changed': RequestedVehiclesChanged
    'material-amount-changed': MaterialAmountChanged
    'used-crystals-changed': UsedCrystalsChanged
    'cavern-discovered': CavernDiscovered
    'ore-found': OreFoundEvent
    'air-level-changed': AirLevelChanged
    'nerp-message': NerpMessageEvent
    'nerp-message-next': BaseEvent
    'setup-priority-list': SetupPriorityList
    'pause-game': BaseEvent
    'unpause-game': BaseEvent
    'update-priorities': UpdatePriorities
    'toggle-alarm': ToggleAlarmEvent
    'dynamite-explosion': DynamiteExplosionEvent
    'game-result-state': GameResultEvent
    'restart-game': RestartGameEvent
}

export interface WorldLocationEventMap {
    'location-death': GenericDeathEvent
    'location-monster': GenericMonsterEvent
    'location-monster-gone': WorldLocationEvent
    'location-crystal-found': CrystalFoundEvent
    'location-under-attack': UnderAttackEvent
    'location-landslide': LandslideEvent
    'location-power-drain': PowerDrainEvent
    'location-slug-emerge': SlugEmergeEvent
    'location-slug-gone': WorldLocationEvent
    'location-raider-discovered': RaiderDiscoveredEvent
}

export interface EventTypeMap extends DefaultEventMap, WorldLocationEventMap {
}
