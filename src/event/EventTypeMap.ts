import { AdvanceAfterRewardsEvent, BuildingsChangedEvent, DeselectAll, FollowerSetCanvasEvent, FollowerSetLookAtEvent, GuiBackButtonClicked, GuiBuildButtonClicked, GuiButtonBlinkEvent, GuiGetToolButtonClicked, GuiTrainRaiderButtonClicked, InitRadarMap, RaidersAmountChangedEvent, RaiderTrainingCompleteEvent, SelectionChanged, SelectionFrameChangeEvent, SetSpaceToContinueEvent, ShowGameResultEvent, ShowMissionAdvisorEvent, ShowMissionBriefingEvent, ShowOptionsEvent, UpdateRadarCamera, UpdateRadarEntityEvent, UpdateRadarSurface, UpdateRadarTerrain, VehicleUpgradeCompleteEvent } from './LocalEvents'
import { AirLevelChanged, CavernDiscovered, DynamiteExplosionEvent, GameResultEvent, JobCreateEvent, LevelSelectedEvent, MaterialAmountChanged, MonsterEmergeEvent, MonsterLaserHitEvent, NerpMessageEvent, NerpSuppressArrowEvent, OreFoundEvent, RequestedRaidersChanged, RequestedVehiclesChanged, RestartGameEvent, ShootLaserEvent, ToggleAlarmEvent, UpdatePriorities, UsedCrystalsChanged, WorldLocationEvent } from './WorldEvents'
import { CameraControl, CancelBuilding, CancelSurfaceJobs, ChangeBuildingPowerState, ChangeCameraEvent, ChangePreferences, ChangeTooltip, CreateClearRubbleJob, CreateDrillJob, CreateDynamiteJob, CreatePowerPath, CreateReinforceJob, DropBirdScarer, HideTooltip, MakeRubble, PickTool, PlaceFence, PlaySoundEvent, RaiderBeamUp, RaiderDrop, RaiderEat, RaiderUpgrade, RepairBuilding, RepairLava, SelectBuildMode, TrainRaider, UpgradeBuilding, UpgradeVehicle, VehicleBeamUp, VehicleCallMan, VehicleDriverGetOut, VehicleLoad, VehicleUnload } from './GuiCommand'

export class BaseEvent {
    constructor(readonly type: keyof EventTypeMap) {
    }
}

/**
 * All mappings must be unique! Events trigger the same handlers otherwise, regardless of the event key being used
 */

export interface DefaultEventMap {
    'selection-changed': SelectionChanged
    'deselect-all': DeselectAll
    'buildings-changed': BuildingsChangedEvent
    'raider-amount-changed': RaidersAmountChangedEvent
    'raider-training-complete': RaiderTrainingCompleteEvent
    'vehicle-upgrade-complete': VehicleUpgradeCompleteEvent
    'show-mission-briefing': ShowMissionBriefingEvent
    'show-mission-advisor': ShowMissionAdvisorEvent
    'show-game-result': ShowGameResultEvent
    'show-options': ShowOptionsEvent
    'set-space-to-continue': SetSpaceToContinueEvent
    'follower-set-canvas': FollowerSetCanvasEvent
    'follower-set-look-at': FollowerSetLookAtEvent
    'follower-render-start': BaseEvent
    'follower-render-stop': BaseEvent
    'selection-frame-change': SelectionFrameChangeEvent
    'init-radar-map': InitRadarMap
    'update-radar-entity': UpdateRadarEntityEvent
    'update-radar-terrain': UpdateRadarTerrain
    'update-radar-surface': UpdateRadarSurface
    'update-radar-camera': UpdateRadarCamera
    'gui-button-blink': GuiButtonBlinkEvent
    'gui-back-button-clicked': GuiBackButtonClicked
    'gui-build-button-clicked': GuiBuildButtonClicked
    'gui-get-tool-button-clicked': GuiGetToolButtonClicked
    'gui-train-raider-button-clicked': GuiTrainRaiderButtonClicked
    'advance-after-rewards': AdvanceAfterRewardsEvent

    'command-tooltip-change': ChangeTooltip
    'command-tooltip-hide': HideTooltip
    'command-play-sound': PlaySoundEvent
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
    'command-cancel-construction': CancelBuilding
    'command-vehicle-get-man': VehicleCallMan
    'command-vehicle-beamup': VehicleBeamUp
    'command-vehicle-driver-get-out': VehicleDriverGetOut
    'command-vehicle-unload': VehicleUnload
    'command-vehicle-load': VehicleLoad
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
    'monster-emerge': MonsterEmergeEvent
    'nerp-message': NerpMessageEvent
    'nerp-message-next': BaseEvent
    'nerp-suppress-arrow': NerpSuppressArrowEvent
    'pause-game': BaseEvent
    'unpause-game': BaseEvent
    'update-priorities': UpdatePriorities
    'toggle-alarm': ToggleAlarmEvent
    'dynamite-explosion': DynamiteExplosionEvent
    'game-result-state': GameResultEvent
    'restart-game': RestartGameEvent
    'shoot-laser': ShootLaserEvent
    'monster-laser-hit': MonsterLaserHitEvent
}

export interface WorldLocationEventMap {
    'location-death': WorldLocationEvent
    'location-monster': WorldLocationEvent
    'location-monster-gone': WorldLocationEvent
    'location-crystal-found': WorldLocationEvent
    'location-under-attack': WorldLocationEvent
    'location-landslide': WorldLocationEvent
    'location-power-drain': WorldLocationEvent
    'location-slug-emerge': WorldLocationEvent
    'location-slug-gone': WorldLocationEvent
    'location-raider-discovered': WorldLocationEvent
}

export interface EventTypeMap extends DefaultEventMap, WorldLocationEventMap {
}
