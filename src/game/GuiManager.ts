import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { CameraControl, ChangeBuildingPowerState, ChangePriorityList, ChangeRaiderSpawnRequest, RequestVehicleSpawn, SelectBuildMode, SelectedRaiderPickTool, TrainRaider } from '../event/GuiCommand'
import { SelectionChanged } from '../event/LocalEvents'
import { JobCreateEvent, RequestedRaidersChanged } from '../event/WorldEvents'
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
import { EatJob } from './model/job/EatJob'
import { GetToolJob } from './model/job/GetToolJob'
import { TrainJob } from './model/job/TrainJob'
import { UpgradeJob } from './model/job/UpgradeJob'
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

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager, jobSupervisor: Supervisor, gameLayerCanvas: HTMLCanvasElement) {
        EventBus.registerEventListener(EventKey.COMMAND_PICK_TOOL, (event: SelectedRaiderPickTool) => {
            GameState.selectedRaiders.forEach((r) => {
                if (!r.hasTool(event.tool)) {
                    r.setJob(new GetToolJob(event.tool, null))
                }
            })
            EventBus.publishEvent(new SelectionChanged())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CREATE_POWER_PATH, () => {
            new PowerPathBuildingSite(GameState.selectedSurface)
        })
        EventBus.registerEventListener(EventKey.COMMAND_MAKE_RUBBLE, () => {
            GameState.selectedSurface?.makeRubble(2)
            EventBus.publishEvent(new SelectionChanged())
        })
        EventBus.registerEventListener(EventKey.COMMAND_PLACE_FENCE, () => {
            const selectedSurface = GameState.selectedSurface
            if (selectedSurface) {
                GameState.getClosestBuildingByType(selectedSurface.getCenterWorld(), EntityType.TOOLSTATION)?.spawnFence(selectedSurface)
            }
            EventBus.publishEvent(new SelectionChanged())
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
            GameState.selectedSurface?.createDrillJob()
            EventBus.publishEvent(new SelectionChanged())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CREATE_REINFORCE_JOB, () => {
            GameState.selectedSurface?.createReinforceJob()
            EventBus.publishEvent(new SelectionChanged())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CREATE_DYNAMITE_JOB, () => {
            GameState.selectedSurface?.createDynamiteJob()
            EventBus.publishEvent(new SelectionChanged())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CANCEL_SURFACE_JOBS, () => {
            GameState.selectedSurface?.cancelJobs()
            EventBus.publishEvent(new SelectionChanged())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CREATE_CLEAR_RUBBLE_JOB, () => {
            GameState.selectedSurface?.createClearRubbleJob()
            EventBus.publishEvent(new SelectionChanged())
        })
        EventBus.registerEventListener(EventKey.COMMAND_UPGRADE_BUILDING, () => {
            GameState.selectedBuilding?.upgrade()
        })
        EventBus.registerEventListener(EventKey.COMMAND_BUILDING_BEAMUP, () => {
            GameState.selectedBuilding?.beamUp()
        })
        EventBus.registerEventListener(EventKey.COMMAND_CHANGE_BUILDING_POWER_STATE, (event: ChangeBuildingPowerState) => {
            if (!event.state) {
                GameState.selectedBuilding?.turnOffPower()
            } else {
                GameState.selectedBuilding?.turnOnPower()
            }
        })
        EventBus.registerEventListener(EventKey.COMMAND_RAIDER_EAT, () => {
            GameState.selectedRaiders.forEach((r) => !r.isDriving() && r.setJob(new EatJob()))
            EventBus.publishEvent(new SelectionChanged())
        })
        EventBus.registerEventListener(EventKey.COMMAND_RAIDER_UPGRADE, () => {
            GameState.selectedRaiders.forEach((r) => {
                const closestToolstation = GameState.getClosestBuildingByType(r.getPosition(), EntityType.TOOLSTATION)
                if (closestToolstation && r.level < r.stats.Levels) {
                    r.setJob(new UpgradeJob(closestToolstation))
                }
            })
            EventBus.publishEvent(new SelectionChanged())
        })
        EventBus.registerEventListener(EventKey.COMMAND_RAIDER_BEAMUP, () => {
            GameState.selectedRaiders.forEach((r) => r.beamUp())
        })
        EventBus.registerEventListener(EventKey.COMMAND_TRAIN_RAIDER, (event: TrainRaider) => {
            GameState.selectedRaiders.forEach((r) => !r.hasTraining(event.training) && r.setJob(new TrainJob(event.training, null)))
            EventBus.publishEvent(new SelectionChanged())
            return true
        })
        EventBus.registerEventListener(EventKey.COMMAND_RAIDER_DROP, () => {
            GameState.selectedRaiders?.forEach((r) => r.dropItem())
        })
        EventBus.registerEventListener(EventKey.COMMAND_SELECT_BUILD_MODE, (event: SelectBuildMode) => {
            GameState.buildModeSelection?.removeFromScene()
            GameState.buildModeSelection = GuiManager.buildingFromType(event.entityType, worldMgr, sceneMgr)
        })
        EventBus.registerEventListener(EventKey.COMMAND_CANCEL_BUILD_MODE, () => {
            GameState.buildModeSelection?.removeFromScene()
            GameState.buildModeSelection = null
        })
        EventBus.registerEventListener(EventKey.COMMAND_CANCEL_CONSTRUCTION, () => {
            GameState.selectedSurface.site?.cancelSite()
        })
        EventBus.registerEventListener(EventKey.COMMAND_REQUEST_VEHICLE_SPAWN, (event: RequestVehicleSpawn) => {
            console.log('Vehicle spawn requested for: ' + EntityType[event.vehicle])
            const pads = GameState.getBuildingsByType(EntityType.TELEPORT_PAD).filter((b) => !b.spawning) // TODO check for "correct" teleport station
            if (pads.length > 0) {
                const teleportPad = pads.random()
                const vehicle = GuiManager.vehicleFromType(event.vehicle, worldMgr, sceneMgr)
                vehicle.addToScene(teleportPad.primaryPathSurface.getCenterWorld2D(), teleportPad.getHeading())
                vehicle.changeActivity(VehicleActivity.TeleportIn, () => {
                    vehicle.changeActivity()
                    vehicle.createPickSphere()
                    GameState.vehicles.push(vehicle)
                })
            }
            // TODO check for crystals amount and reduce it
            // TODO otherwise start a check interval?
            EventBus.publishEvent(new SelectionChanged())
        })
        EventBus.registerEventListener(EventKey.COMMAND_VEHICLE_GET_MAN, () => {
            const selectedVehicle = GameState.selectedVehicle
            if (selectedVehicle) {
                EventBus.publishEvent(new JobCreateEvent(new VehicleCallManJob(selectedVehicle)))
                EventBus.publishEvent(new SelectionChanged())
            }
        })
        EventBus.registerEventListener(EventKey.COMMAND_VEHICLE_BEAMUP, () => {
            GameState.selectedVehicle?.beamUp()
            EventBus.publishEvent(new SelectionChanged())
        })
        EventBus.registerEventListener(EventKey.COMMAND_VEHICLE_DRIVER_GET_OUT, () => {
            GameState.selectedVehicle?.dropDriver()
            EventBus.publishEvent(new SelectionChanged())
        })
        EventBus.registerEventListener(EventKey.COMMAND_CHANGE_PRIORITY_LIST, (event: ChangePriorityList) => {
            jobSupervisor.updatePriorities(event.priorityList)
        })
        EventBus.registerEventListener(EventKey.COMMAND_CAMERA_CONTROL, (event: CameraControl) => {
            if (event.zoomIn) { // TODO implement custom camera controls, that is better remotely controllable
                const zoomInEvent = new WheelEvent('wheel', {deltaY: -5})
                gameLayerCanvas.dispatchEvent(zoomInEvent)
                gameLayerCanvas.ownerDocument.dispatchEvent(zoomInEvent)
            }
            if (event.zoomOut) { // TODO implement custom camera controls, that is better remotely controllable
                const zoomOutEvent = new WheelEvent('wheel', {deltaY: 5})
                gameLayerCanvas.dispatchEvent(zoomOutEvent)
                gameLayerCanvas.ownerDocument.dispatchEvent(zoomOutEvent)
            }
            if (event.cycleBuilding) {
                this.buildingCycleIndex = (this.buildingCycleIndex + 1) % GameState.buildings.length
                const target = GameState.buildings[this.buildingCycleIndex].primarySurface.getCenterWorld()
                const offsetTargetToCamera = sceneMgr.camera.position.clone().sub(sceneMgr.controls.target)
                sceneMgr.camera.position.copy(target.clone().add(offsetTargetToCamera))
                sceneMgr.controls.target.copy(target)
                sceneMgr.controls.update()
            }
        })
    }

    static buildingFromType(entityType: EntityType, worldMgr: WorldManager, sceneMgr: SceneManager): BuildingEntity {
        switch (entityType) {
            case EntityType.TOOLSTATION:
                return new Toolstation(worldMgr, sceneMgr)
            case EntityType.TELEPORT_PAD:
                return new TeleportPad(worldMgr, sceneMgr)
            case EntityType.DOCKS:
                return new Docks(worldMgr, sceneMgr)
            case EntityType.POWER_STATION:
                return new PowerStation(worldMgr, sceneMgr)
            case EntityType.BARRACKS:
                return new Barracks(worldMgr, sceneMgr)
            case EntityType.UPGRADE:
                return new Upgrade(worldMgr, sceneMgr)
            case EntityType.GEODOME:
                return new Geodome(worldMgr, sceneMgr)
            case EntityType.ORE_REFINERY:
                return new OreRefinery(worldMgr, sceneMgr)
            case EntityType.GUNSTATION:
                return new GunStation(worldMgr, sceneMgr)
            case EntityType.TELEPORT_BIG:
                return new TeleportBig(worldMgr, sceneMgr)
            default:
                throw 'Unexpected building type: ' + EntityType[entityType]
        }
    }

    static vehicleFromType(entityType: EntityType, worldMgr: WorldManager, sceneMgr: SceneManager): VehicleEntity {
        switch (entityType) {
            case EntityType.HOVERBOARD:
                return new Hoverboard(worldMgr, sceneMgr)
            case EntityType.SMALL_DIGGER:
                return new SmallDigger(worldMgr, sceneMgr)
            case EntityType.SMALL_TRUCK:
                return new SmallTruck(worldMgr, sceneMgr)
            case EntityType.SMALL_CAT:
                return new SmallCat(worldMgr, sceneMgr)
            case EntityType.SMALL_MLP:
                return new SmallMlp(worldMgr, sceneMgr)
            case EntityType.SMALL_HELI:
                return new SmallHeli(worldMgr, sceneMgr)
            case EntityType.BULLDOZER:
                return new BullDozer(worldMgr, sceneMgr)
            case EntityType.WALKER_DIGGER:
                return new WalkerDigger(worldMgr, sceneMgr)
            case EntityType.LARGE_MLP:
                return new LargeMlp(worldMgr, sceneMgr)
            case EntityType.LARGE_DIGGER:
                return new LargeDigger(worldMgr, sceneMgr)
            case EntityType.LARGE_CAT:
                return new LargeCat(worldMgr, sceneMgr)
            default:
                throw 'Unexpected vehicle type: ' + EntityType[entityType]
        }
    }

}
