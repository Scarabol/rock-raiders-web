import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { CameraControl, ChangeBuildingPowerState, ChangePriorityList, ChangeRaiderSpawnRequest, RequestVehicleSpawn, SelectBuildMode, SelectedRaiderPickTool, TrainRaider } from '../event/GuiCommand'
import { DeselectAll } from '../event/LocalEvents'
import { JobCreateEvent, RequestedRaidersChanged } from '../event/WorldEvents'
import { EntityManager } from './EntityManager'
import { BuildingEntity } from './model/building/BuildingEntity'
import { Barracks } from './model/building/entities/Barracks'
import { Docks } from './model/building/entities/Docks'
import { Geodome } from './model/building/entities/Geodome'
import { GunStation } from './model/building/entities/GunStation'
import { OreRefinery } from './model/building/entities/OreRefinery'
import { PowerStation } from './model/building/entities/PowerStation'
import { TeleportBig } from './model/building/entities/TeleportBig'
import { TeleportPad } from './model/building/entities/TeleportPad'
import { Toolstation } from './model/building/entities/Toolstation'
import { Upgrade } from './model/building/entities/Upgrade'
import { PowerPathBuildingSite } from './model/building/PowerPathBuildingSite'
import { EntityType } from './model/EntityType'
import { GameState } from './model/GameState'
import { EatJob } from './model/job/raider/EatJob'
import { GetToolJob } from './model/job/raider/GetToolJob'
import { TrainRaiderJob } from './model/job/raider/TrainRaiderJob'
import { UpgradeRaiderJob } from './model/job/raider/UpgradeRaiderJob'
import { VehicleCallManJob } from './model/job/VehicleCallManJob'
import { BullDozer } from './model/vehicle/entities/BullDozer'
import { Hoverboard } from './model/vehicle/entities/Hoverboard'
import { LargeCat } from './model/vehicle/entities/LargeCat'
import { LargeDigger } from './model/vehicle/entities/LargeDigger'
import { LargeMlp } from './model/vehicle/entities/LargeMlp'
import { SmallCat } from './model/vehicle/entities/SmallCat'
import { SmallDigger } from './model/vehicle/entities/SmallDigger'
import { SmallHeli } from './model/vehicle/entities/SmallHeli'
import { SmallMlp } from './model/vehicle/entities/SmallMlp'
import { SmallTruck } from './model/vehicle/entities/SmallTruck'
import { WalkerDigger } from './model/vehicle/entities/WalkerDigger'
import { VehicleActivity } from './model/vehicle/VehicleActivity'
import { VehicleEntity } from './model/vehicle/VehicleEntity'
import { SceneManager } from './SceneManager'
import { Supervisor } from './Supervisor'
import { WorldManager } from './WorldManager'

export class GuiManager {

    buildingCycleIndex: number = 0

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager, entityMgr: EntityManager, jobSupervisor: Supervisor, gameLayerCanvas: HTMLCanvasElement) {
        EventBus.registerEventListener(EventKey.COMMAND_PICK_TOOL, (event: SelectedRaiderPickTool) => {
            entityMgr.selectedRaiders.forEach((r) => {
                if (!r.hasTool(event.tool)) {
                    r.setJob(new GetToolJob(entityMgr, event.tool, null))
                }
            })
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CREATE_POWER_PATH, () => {
            new PowerPathBuildingSite(entityMgr, entityMgr.selectedSurface)
        })
        EventBus.registerEventListener(EventKey.COMMAND_MAKE_RUBBLE, () => {
            entityMgr.selectedSurface?.makeRubble(2)
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_PLACE_FENCE, () => {
            const selectedSurface = entityMgr.selectedSurface
            if (selectedSurface) {
                entityMgr.getClosestBuildingByType(selectedSurface.getCenterWorld(), EntityType.TOOLSTATION)?.spawnFence(selectedSurface)
            }
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
            entityMgr.selectedSurface?.createDrillJob()
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CREATE_REINFORCE_JOB, () => {
            entityMgr.selectedSurface?.createReinforceJob()
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CREATE_DYNAMITE_JOB, () => {
            entityMgr.selectedSurface?.createDynamiteJob()
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CANCEL_SURFACE_JOBS, () => {
            entityMgr.selectedSurface?.cancelJobs()
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CREATE_CLEAR_RUBBLE_JOB, () => {
            entityMgr.selectedSurface?.createClearRubbleJob()
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_UPGRADE_BUILDING, () => {
            entityMgr.selectedBuilding?.upgrade()
        })
        EventBus.registerEventListener(EventKey.COMMAND_BUILDING_BEAMUP, () => {
            entityMgr.selectedBuilding?.beamUp()
        })
        EventBus.registerEventListener(EventKey.COMMAND_CHANGE_BUILDING_POWER_STATE, (event: ChangeBuildingPowerState) => {
            if (!event.state) {
                entityMgr.selectedBuilding?.turnOffPower()
            } else {
                entityMgr.selectedBuilding?.turnOnPower()
            }
        })
        EventBus.registerEventListener(EventKey.COMMAND_RAIDER_EAT, () => {
            entityMgr.selectedRaiders.forEach((r) => !r.isDriving() && r.setJob(new EatJob()))
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_RAIDER_UPGRADE, () => {
            entityMgr.selectedRaiders.forEach((r) => {
                const closestToolstation = entityMgr.getClosestBuildingByType(r.getPosition(), EntityType.TOOLSTATION)
                if (closestToolstation && r.level < r.stats.Levels) {
                    r.setJob(new UpgradeRaiderJob(closestToolstation))
                }
            })
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_RAIDER_BEAMUP, () => {
            entityMgr.selectedRaiders.forEach((r) => r.beamUp())
        })
        EventBus.registerEventListener(EventKey.COMMAND_TRAIN_RAIDER, (event: TrainRaider) => {
            entityMgr.selectedRaiders.forEach((r) => !r.hasTraining(event.training) && r.setJob(new TrainRaiderJob(entityMgr, event.training, null)))
            EventBus.publishEvent(new DeselectAll())
            return true
        })
        EventBus.registerEventListener(EventKey.COMMAND_RAIDER_DROP, () => {
            entityMgr.selectedRaiders?.forEach((r) => r.dropItem())
        })
        EventBus.registerEventListener(EventKey.COMMAND_SELECT_BUILD_MODE, (event: SelectBuildMode) => {
            worldMgr.setBuildModeSelection(GuiManager.createBuildingFromType(event.entityType, sceneMgr, entityMgr))
        })
        EventBus.registerEventListener(EventKey.COMMAND_CANCEL_BUILD_MODE, () => {
            worldMgr.setBuildModeSelection(null)
            sceneMgr.buildMarker?.hideAllMarker()
        })
        EventBus.registerEventListener(EventKey.COMMAND_CANCEL_CONSTRUCTION, () => {
            entityMgr.selectedSurface.site?.cancelSite()
        })
        EventBus.registerEventListener(EventKey.COMMAND_REQUEST_VEHICLE_SPAWN, (event: RequestVehicleSpawn) => {
            console.log('Vehicle spawn requested for: ' + EntityType[event.vehicle])
            const pads = entityMgr.getBuildingsByType(EntityType.TELEPORT_PAD).filter((b) => !b.spawning) // TODO check for "correct" teleport station
            if (pads.length > 0) {
                const teleportPad = pads.random()
                const vehicle = GuiManager.createVehicleFromType(event.vehicle, sceneMgr, entityMgr)
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
            const selectedVehicle = entityMgr.selectedVehicle
            if (selectedVehicle) {
                EventBus.publishEvent(new JobCreateEvent(new VehicleCallManJob(selectedVehicle)))
                EventBus.publishEvent(new DeselectAll())
            }
        })
        EventBus.registerEventListener(EventKey.COMMAND_VEHICLE_BEAMUP, () => {
            entityMgr.selectedVehicle?.beamUp()
            EventBus.publishEvent(new DeselectAll())
        })
        EventBus.registerEventListener(EventKey.COMMAND_VEHICLE_DRIVER_GET_OUT, () => {
            entityMgr.selectedVehicle?.dropDriver()
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

    static createBuildingFromType(entityType: EntityType, sceneMgr: SceneManager, entityMgr: EntityManager): BuildingEntity {
        switch (entityType) {
            case EntityType.TOOLSTATION:
                return new Toolstation(sceneMgr, entityMgr)
            case EntityType.TELEPORT_PAD:
                return new TeleportPad(sceneMgr, entityMgr)
            case EntityType.DOCKS:
                return new Docks(sceneMgr, entityMgr)
            case EntityType.POWER_STATION:
                return new PowerStation(sceneMgr, entityMgr)
            case EntityType.BARRACKS:
                return new Barracks(sceneMgr, entityMgr)
            case EntityType.UPGRADE:
                return new Upgrade(sceneMgr, entityMgr)
            case EntityType.GEODOME:
                return new Geodome(sceneMgr, entityMgr)
            case EntityType.ORE_REFINERY:
                return new OreRefinery(sceneMgr, entityMgr)
            case EntityType.GUNSTATION:
                return new GunStation(sceneMgr, entityMgr)
            case EntityType.TELEPORT_BIG:
                return new TeleportBig(sceneMgr, entityMgr)
            default:
                throw 'Unexpected building type: ' + EntityType[entityType]
        }
    }

    static createVehicleFromType(entityType: EntityType, sceneMgr: SceneManager, entityMgr: EntityManager): VehicleEntity {
        switch (entityType) {
            case EntityType.HOVERBOARD:
                return new Hoverboard(sceneMgr, entityMgr)
            case EntityType.SMALL_DIGGER:
                return new SmallDigger(sceneMgr, entityMgr)
            case EntityType.SMALL_TRUCK:
                return new SmallTruck(sceneMgr, entityMgr)
            case EntityType.SMALL_CAT:
                return new SmallCat(sceneMgr, entityMgr)
            case EntityType.SMALL_MLP:
                return new SmallMlp(sceneMgr, entityMgr)
            case EntityType.SMALL_HELI:
                return new SmallHeli(sceneMgr, entityMgr)
            case EntityType.BULLDOZER:
                return new BullDozer(sceneMgr, entityMgr)
            case EntityType.WALKER_DIGGER:
                return new WalkerDigger(sceneMgr, entityMgr)
            case EntityType.LARGE_MLP:
                return new LargeMlp(sceneMgr, entityMgr)
            case EntityType.LARGE_DIGGER:
                return new LargeDigger(sceneMgr, entityMgr)
            case EntityType.LARGE_CAT:
                return new LargeCat(sceneMgr, entityMgr)
            default:
                throw 'Unexpected vehicle type: ' + EntityType[entityType]
        }
    }

}
