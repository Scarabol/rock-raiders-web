import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { CameraControl, ChangeBuildingPowerState, ChangePriorityList, ChangeRaiderSpawnRequest, RequestVehicleSpawn, SelectBuildMode, SelectedRaiderPickTool, TrainRaider } from '../event/GuiCommand'
import { DeselectAll } from '../event/LocalEvents'
import { JobCreateEvent, RequestedRaidersChanged } from '../event/WorldEvents'
import { EntityManager } from './EntityManager'
import { BuildingFactory } from './model/building/BuildingFactory'
import { PowerPathBuildingSite } from './model/building/PowerPathBuildingSite'
import { EntityType } from './model/EntityType'
import { GameState } from './model/GameState'
import { EatJob } from './model/job/raider/EatJob'
import { GetToolJob } from './model/job/raider/GetToolJob'
import { TrainRaiderJob } from './model/job/raider/TrainRaiderJob'
import { UpgradeRaiderJob } from './model/job/raider/UpgradeRaiderJob'
import { VehicleCallManJob } from './model/job/VehicleCallManJob'
import { VehicleActivity } from './model/vehicle/VehicleActivity'
import { VehicleFactory } from './model/vehicle/VehicleFactory'
import { SceneManager } from './SceneManager'
import { Supervisor } from './Supervisor'
import { WorldManager } from './WorldManager'

export class GuiManager {

    buildingCycleIndex: number = 0

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager, entityMgr: EntityManager, jobSupervisor: Supervisor, gameLayerCanvas: HTMLCanvasElement) {
        EventBus.registerEventListener(EventKey.COMMAND_PICK_TOOL, (event: SelectedRaiderPickTool) => {
            entityMgr.selection.raiders.forEach((r) => {
                if (!r.hasTool(event.tool)) {
                    r.setJob(new GetToolJob(entityMgr, event.tool, null))
                }
            })
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CREATE_POWER_PATH, () => {
            new PowerPathBuildingSite(entityMgr, entityMgr.selection.surface)
        })
        EventBus.registerEventListener(EventKey.COMMAND_MAKE_RUBBLE, () => {
            entityMgr.selection.surface?.makeRubble(2)
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_PLACE_FENCE, () => {
            const s = entityMgr.selection.surface
            if (s) entityMgr.getClosestBuildingByType(s.getCenterWorld(), EntityType.TOOLSTATION)?.spawnFence(s)
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CHANGE_RAIDER_SPAWN_REQUEST, (event: ChangeRaiderSpawnRequest) => {
            if (event.increase) {
                GameState.requestedRaiders++
            } else {
                GameState.requestedRaiders--
            }
            EventBus.publishEvent(new RequestedRaidersChanged(GameState.requestedRaiders))
        })
        EventBus.registerEventListener(EventKey.COMMAND_CREATE_DRILL_JOB, () => {
            entityMgr.selection.surface?.createDrillJob()
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CREATE_REINFORCE_JOB, () => {
            entityMgr.selection.surface?.createReinforceJob()
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CREATE_DYNAMITE_JOB, () => {
            entityMgr.selection.surface?.createDynamiteJob()
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CANCEL_SURFACE_JOBS, () => {
            entityMgr.selection.surface?.cancelJobs()
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CREATE_CLEAR_RUBBLE_JOB, () => {
            entityMgr.selection.surface?.createClearRubbleJob()
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_UPGRADE_BUILDING, () => {
            entityMgr.selection.building?.upgrade()
        })
        EventBus.registerEventListener(EventKey.COMMAND_BUILDING_BEAMUP, () => {
            entityMgr.selection.building?.beamUp()
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
            entityMgr.selection.raiders.forEach((r) => r.dropItem())
        })
        EventBus.registerEventListener(EventKey.COMMAND_SELECT_BUILD_MODE, (event: SelectBuildMode) => {
            sceneMgr.setBuildModeSelection(BuildingFactory.createBuildingFromType(event.entityType, sceneMgr, entityMgr))
        })
        EventBus.registerEventListener(EventKey.COMMAND_CANCEL_BUILD_MODE, () => {
            sceneMgr.setBuildModeSelection(null)
        })
        EventBus.registerEventListener(EventKey.COMMAND_CANCEL_CONSTRUCTION, () => {
            entityMgr.selection.surface.site?.cancelSite()
        })
        EventBus.registerEventListener(EventKey.COMMAND_REQUEST_VEHICLE_SPAWN, (event: RequestVehicleSpawn) => {
            console.log('Vehicle spawn requested for: ' + EntityType[event.vehicle])
            // FIXME manage amount of requested vehicles per type in entity manager
            const pads = entityMgr.getBuildingsByType(EntityType.TELEPORT_PAD).filter((b) => !b.spawning) // TODO check for "correct" teleport station
            if (pads.length > 0) {
                const teleportPad = pads.random()
                const vehicle = VehicleFactory.createVehicleFromType(event.vehicle, sceneMgr, entityMgr)
                vehicle.addToScene(teleportPad.primaryPathSurface.getCenterWorld2D(), teleportPad.getHeading())
                vehicle.changeActivity(VehicleActivity.TeleportIn, () => {
                    vehicle.changeActivity()
                    vehicle.sceneEntity.createPickSphere(vehicle.stats.PickSphere, vehicle)
                    entityMgr.vehicles.push(vehicle)
                })
            }
            // TODO check for crystals amount and reduce it
            // TODO otherwise start a check interval?
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_VEHICLE_GET_MAN, () => {
            entityMgr.selection.vehicles.forEach((v) => {
                if (!v.callManJob && !v.driver) EventBus.publishEvent(new JobCreateEvent(new VehicleCallManJob(v)))
            })
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_VEHICLE_BEAMUP, () => {
            entityMgr.selection.vehicles.forEach((v) => v.beamUp())
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_VEHICLE_DRIVER_GET_OUT, () => {
            entityMgr.selection.vehicles.forEach((v) => v.dropDriver())
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CHANGE_PRIORITY_LIST, (event: ChangePriorityList) => {
            jobSupervisor.updatePriorities(event.priorityList)
        })
        EventBus.registerEventListener(EventKey.COMMAND_CAMERA_CONTROL, (event: CameraControl) => {
            if (event.zoom) { // TODO implement custom camera controls, that is better remotely controllable
                const zoomInEvent = new WheelEvent('wheel', {deltaY: 5 * event.zoom})
                gameLayerCanvas.dispatchEvent(zoomInEvent)
                gameLayerCanvas.ownerDocument.dispatchEvent(zoomInEvent)
            }
            if (event.cycleBuilding) {
                this.buildingCycleIndex = (this.buildingCycleIndex + 1) % entityMgr.buildings.length
                const target = entityMgr.buildings[this.buildingCycleIndex].primarySurface.getCenterWorld()
                const offsetTargetToCamera = sceneMgr.camera.position.clone().sub(sceneMgr.controls.target)
                sceneMgr.camera.position.copy(target.clone().add(offsetTargetToCamera))
                sceneMgr.controls.target.copy(target)
                sceneMgr.controls.update()
            }
            if (event.rotationIndex >= 0) { // TODO implement custom camera controls, that is better remotely controllable
                console.log('TODO implement rotate camera: ' + (['left', 'up', 'right', 'down'][event.rotationIndex]))
            }
        })
    }

}
