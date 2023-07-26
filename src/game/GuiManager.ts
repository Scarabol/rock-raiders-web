import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { CameraControl, ChangeBuildingPowerState, ChangePriorityList, ChangeRaiderSpawnRequest, PlaySoundEvent, RequestVehicleSpawn, SelectBuildMode, SelectedRaiderPickTool, TrainRaider, UpgradeVehicle } from '../event/GuiCommand'
import { DeselectAll, UpdatePriorities } from '../event/LocalEvents'
import { JobCreateEvent, RequestedRaidersChanged, RequestedVehiclesChanged } from '../event/WorldEvents'
import { EntityType } from './model/EntityType'
import { ManVehicleJob } from './model/job/ManVehicleJob'
import { EatJob } from './model/job/raider/EatJob'
import { GetToolJob } from './model/job/raider/GetToolJob'
import { TrainRaiderJob } from './model/job/raider/TrainRaiderJob'
import { UpgradeRaiderJob } from './model/job/raider/UpgradeRaiderJob'
import { WorldManager } from './WorldManager'
import { SurfaceType } from './terrain/SurfaceType'
import { BuildingSite } from './model/building/BuildingSite'
import { SoundManager } from '../audio/SoundManager'
import { SaveGameManager } from '../resource/SaveGameManager'
import { SelectionFrameComponent } from './component/SelectionFrameComponent'
import { BeamUpComponent } from './component/BeamUpComponent'
import { CameraRotation } from '../scene/BirdViewControls'
import { RepairBuildingJob } from './model/job/raider/RepairBuildingJob'

export class GuiManager {
    buildingCycleIndex: number = 0

    constructor(worldMgr: WorldManager) {
        const sceneMgr = worldMgr.sceneMgr
        const cameraControls = sceneMgr.controls
        const entityMgr = worldMgr.entityMgr
        EventBus.registerEventListener(EventKey.COMMAND_PICK_TOOL, (event: SelectedRaiderPickTool) => {
            entityMgr.selection.raiders.forEach((r) => {
                if (!r.hasTool(event.tool)) {
                    r.setJob(new GetToolJob(entityMgr, event.tool, null))
                }
            })
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CREATE_POWER_PATH, () => {
            entityMgr.selection.surface.setSurfaceType(SurfaceType.POWER_PATH_BUILDING_SITE)
            BuildingSite.createImproveSurfaceSite(worldMgr, entityMgr.selection.surface)
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_MAKE_RUBBLE, () => {
            entityMgr.selection.surface?.makeRubble(2)
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_PLACE_FENCE, () => {
            const targetSurface = entityMgr.selection.surface
            if (targetSurface) {
                entityMgr.getClosestBuildingByType(targetSurface.getCenterWorld(), EntityType.TOOLSTATION)?.spawnFence(targetSurface)
                targetSurface.fenceRequested = true
            }
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_FENCE_BEAMUP, () => {
            const fence = entityMgr.selection.fence
            fence.worldMgr.ecs.getComponents(fence.entity).get(SelectionFrameComponent)?.deselect()
            fence.worldMgr.ecs.removeComponent(fence.entity, SelectionFrameComponent)
            fence.targetSurface.fence = null
            fence.targetSurface.fenceRequested = false
            // TODO stop spawning lightning animations
            fence.worldMgr.ecs.addComponent(fence.entity, new BeamUpComponent(fence))
            // TODO update defence grid
        })
        EventBus.registerEventListener(EventKey.COMMAND_CHANGE_RAIDER_SPAWN_REQUEST, (event: ChangeRaiderSpawnRequest) => {
            if (event.increase) {
                worldMgr.requestedRaiders++
            } else {
                worldMgr.requestedRaiders--
            }
            EventBus.publishEvent(new RequestedRaidersChanged(worldMgr.requestedRaiders))
        })
        EventBus.registerEventListener(EventKey.COMMAND_CREATE_DRILL_JOB, () => {
            entityMgr.selection.surface?.setupDrillJob()
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CREATE_REINFORCE_JOB, () => {
            entityMgr.selection.surface?.setupReinforceJob()
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CREATE_DYNAMITE_JOB, () => {
            entityMgr.selection.surface?.setupDynamiteJob()
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CANCEL_SURFACE_JOBS, () => {
            entityMgr.selection.surface?.cancelJobs()
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CREATE_CLEAR_RUBBLE_JOB, () => {
            entityMgr.selection.surface?.setupClearRubbleJob()
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_REPAIR_BUILDING, () => {
            if (!entityMgr.selection.building) return
            EventBus.publishEvent(new JobCreateEvent(new RepairBuildingJob(entityMgr.selection.building)))
        })
        EventBus.registerEventListener(EventKey.COMMAND_UPGRADE_BUILDING, () => {
            entityMgr.selection.building?.upgrade()
        })
        EventBus.registerEventListener(EventKey.COMMAND_BUILDING_BEAMUP, () => {
            entityMgr.selection.building?.beamUp(true)
        })
        EventBus.registerEventListener(EventKey.COMMAND_CHANGE_BUILDING_POWER_STATE, (event: ChangeBuildingPowerState) => {
            entityMgr.selection.building?.setPowerSwitch(event.state)
        })
        EventBus.registerEventListener(EventKey.COMMAND_RAIDER_EAT, () => {
            entityMgr.selection.raiders.forEach((r) => !r.isDriving() && r.setJob(new EatJob()))
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_RAIDER_UPGRADE, () => {
            entityMgr.selection.raiders.forEach((r) => {
                const closestToolstation = entityMgr.getClosestBuildingByType(r.getPosition(), EntityType.TOOLSTATION)
                if (closestToolstation && r.level < r.stats.Levels) {
                    r.setJob(new UpgradeRaiderJob(closestToolstation))
                }
            })
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_RAIDER_BEAMUP, () => {
            entityMgr.selection.raiders.forEach((r) => r.beamUp())
        })
        EventBus.registerEventListener(EventKey.COMMAND_TRAIN_RAIDER, (event: TrainRaider) => {
            entityMgr.selection.raiders.forEach((r) => !r.hasTraining(event.training) && r.setJob(new TrainRaiderJob(entityMgr, event.training, null)))
            EventBus.publishEvent(new DeselectAll())
            return true
        })
        EventBus.registerEventListener(EventKey.COMMAND_RAIDER_DROP, () => {
            entityMgr.selection.raiders.forEach((r) => r.stopJob())
        })
        EventBus.registerEventListener(EventKey.COMMAND_SELECT_BUILD_MODE, (event: SelectBuildMode) => {
            sceneMgr.setBuildModeSelection(event.entityType)
        })
        EventBus.registerEventListener(EventKey.COMMAND_CANCEL_BUILD_MODE, () => {
            sceneMgr.setBuildModeSelection(null)
        })
        EventBus.registerEventListener(EventKey.COMMAND_CANCEL_CONSTRUCTION, () => {
            entityMgr.selection.surface.site?.cancelSite()
        })
        EventBus.registerEventListener(EventKey.COMMAND_REQUEST_VEHICLE_SPAWN, (event: RequestVehicleSpawn) => {
            EventBus.publishEvent(new RequestedVehiclesChanged(event.vehicle, event.numRequested))
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_VEHICLE_GET_MAN, () => {
            entityMgr.selection.vehicles.forEach((v) => {
                if (!v.callManJob && !v.driver) EventBus.publishEvent(new JobCreateEvent(new ManVehicleJob(v)))
            })
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_VEHICLE_BEAMUP, () => {
            entityMgr.selection.vehicles.forEach((v) => v.beamUp(true))
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_VEHICLE_DRIVER_GET_OUT, () => {
            entityMgr.selection.vehicles.forEach((v) => v.dropDriver())
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_VEHICLE_UNLOAD, () => {
            entityMgr.selection.vehicles.forEach((v) => v.stopJob())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CHANGE_PRIORITY_LIST, (event: ChangePriorityList) => {
            EventBus.publishEvent(new UpdatePriorities(event.priorityList))
        })
        EventBus.registerEventListener(EventKey.COMMAND_CAMERA_CONTROL, (event: CameraControl) => {
            if (event.zoom) {
                cameraControls.zoom(event.zoom)
            }
            if (event.cycleBuilding) {
                this.buildingCycleIndex = (this.buildingCycleIndex + 1) % entityMgr.buildings.length
                const target = entityMgr.buildings[this.buildingCycleIndex].primarySurface.getCenterWorld()
                cameraControls.jumpTo(target)
            }
            if (event.rotationIndex !== CameraRotation.NONE) cameraControls.rotate(event.rotationIndex)
            if (event.jumpToWorld) {
                const jumpTo = worldMgr.sceneMgr.terrain.getFloorPosition(event.jumpToWorld.getPosition2D())
                cameraControls.jumpTo(jumpTo)
            }
        })
        EventBus.registerEventListener(EventKey.COMMAND_REPAIR_LAVA, () => {
            BuildingSite.createImproveSurfaceSite(worldMgr, entityMgr.selection.surface)
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_PLAY_SOUND, (event: PlaySoundEvent) => {
            SoundManager.playSample(event.sample, event.isVoice)
        })
        EventBus.registerEventListener(EventKey.COMMAND_REMOVE_SELECTION, () => {
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CHANGE_PREFERENCES, () => {
            SaveGameManager.savePreferences()
            SoundManager.sfxAudioTarget.gain.value = SaveGameManager.currentPreferences.volumeSfx / 10
            SoundManager.toggleSfx()
            sceneMgr.setLightLevel(SaveGameManager.currentPreferences.gameBrightness)
            const sfxVolume = SaveGameManager.getSfxVolume()
            SoundManager.playingAudio.forEach((a) => a.setVolume(sfxVolume))
        })
        EventBus.registerEventListener(EventKey.COMMAND_UPGRADE_VEHICLE, (event: UpgradeVehicle) => {
            entityMgr.selection.assignUpgradeJob(event.upgrade)
            EventBus.publishEvent(new DeselectAll())
        })
    }
}
