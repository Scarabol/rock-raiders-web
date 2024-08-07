import { EventKey } from '../event/EventKeyEnum'
import { CameraControl, CameraViewMode, ChangeBuildingPowerState, ChangeCameraEvent, PickTool, PlaySoundEvent, SelectBuildMode, TrainRaider, UpgradeVehicle } from '../event/GuiCommand'
import { DeselectAll, FollowerSetLookAtEvent, SelectionChanged } from '../event/LocalEvents'
import { JobCreateEvent } from '../event/WorldEvents'
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
import { RepairBuildingJob } from './model/job/raider/RepairBuildingJob'
import { MaterialSpawner } from './factory/MaterialSpawner'
import { GenericDeathEvent } from '../event/WorldLocationEvent'
import { PositionComponent } from './component/PositionComponent'
import { RaiderTool } from './model/raider/RaiderTool'
import { GameConfig } from '../cfg/GameConfig'
import { EventBroker } from '../event/EventBroker'
import { AnimatedSceneEntity } from '../scene/AnimatedSceneEntity'
import { ResourceManager } from '../resource/ResourceManager'
import { DynamiteActivity } from './model/anim/AnimationActivity'
import { AnimatedSceneEntityComponent } from './component/AnimatedSceneEntityComponent'
import { Vector3 } from 'three'

export class GuiManager {
    buildingCycleIndex: number = 0

    constructor(worldMgr: WorldManager) {
        const sceneMgr = worldMgr.sceneMgr
        const cameraControls = sceneMgr.birdViewControls
        const entityMgr = worldMgr.entityMgr
        EventBroker.subscribe(EventKey.COMMAND_PICK_TOOL, (event: PickTool) => {
            entityMgr.selection.raiders.forEach((r) => {
                if (r.hasTool(event.tool)) return
                const pathToToolstation = r.findShortestPath(r.worldMgr.entityMgr.getGetToolTargets())
                if (pathToToolstation) r.setJob(new GetToolJob(entityMgr, event.tool, pathToToolstation.target.building))
            })
            EventBroker.publish(new DeselectAll())
        })
        EventBroker.subscribe(EventKey.COMMAND_CREATE_POWER_PATH, () => {
            if (!entityMgr.selection.surface) return
            entityMgr.selection.surface.setSurfaceType(SurfaceType.POWER_PATH_BUILDING_SITE)
            BuildingSite.createImproveSurfaceSite(worldMgr, entityMgr.selection.surface)
            EventBroker.publish(new DeselectAll())
        })
        EventBroker.subscribe(EventKey.COMMAND_MAKE_RUBBLE, () => {
            entityMgr.selection.surface?.makeRubble(2)
            EventBroker.publish(new DeselectAll())
        })
        EventBroker.subscribe(EventKey.COMMAND_PLACE_FENCE, () => {
            const targetSurface = entityMgr.selection.surface
            if (targetSurface) {
                entityMgr.getClosestBuildingByType(targetSurface.getCenterWorld(), EntityType.TOOLSTATION)?.spawnFence(targetSurface)
                targetSurface.fenceRequested = true
            }
            EventBroker.publish(new DeselectAll())
        })
        EventBroker.subscribe(EventKey.COMMAND_FENCE_BEAMUP, () => {
            const fence = entityMgr.selection.fence
            if (!fence) return
            EventBroker.publish(new GenericDeathEvent(fence.worldMgr.ecs.getComponents(fence.entity).get(PositionComponent)))
            fence.worldMgr.ecs.getComponents(fence.entity).get(SelectionFrameComponent)?.deselect()
            fence.worldMgr.ecs.removeComponent(fence.entity, SelectionFrameComponent)
            fence.worldMgr.entityMgr.removeEntity(fence.entity)
            if (fence.targetSurface) {
                fence.targetSurface.fence = undefined
                fence.targetSurface.fenceRequested = false
            }
            fence.worldMgr.ecs.addComponent(fence.entity, new BeamUpComponent(fence))
        })
        EventBroker.subscribe(EventKey.COMMAND_CREATE_DRILL_JOB, () => {
            entityMgr.selection.surface?.setupDrillJob()
            EventBroker.publish(new DeselectAll())
        })
        EventBroker.subscribe(EventKey.COMMAND_CREATE_REINFORCE_JOB, () => {
            entityMgr.selection.surface?.setupReinforceJob()
            EventBroker.publish(new DeselectAll())
        })
        EventBroker.subscribe(EventKey.COMMAND_CREATE_DYNAMITE_JOB, () => {
            entityMgr.selection.surface?.setupDynamiteJob()
            EventBroker.publish(new DeselectAll())
        })
        EventBroker.subscribe(EventKey.COMMAND_CANCEL_SURFACE_JOBS, () => {
            entityMgr.selection.surface?.cancelJobs()
            EventBroker.publish(new DeselectAll())
        })
        EventBroker.subscribe(EventKey.COMMAND_CREATE_CLEAR_RUBBLE_JOB, () => {
            entityMgr.selection.surface?.setupClearRubbleJob()
            EventBroker.publish(new DeselectAll())
        })
        EventBroker.subscribe(EventKey.COMMAND_REPAIR_BUILDING, () => {
            if (!entityMgr.selection.building) return
            EventBroker.publish(new JobCreateEvent(new RepairBuildingJob(entityMgr.selection.building)))
        })
        EventBroker.subscribe(EventKey.COMMAND_UPGRADE_BUILDING, () => {
            entityMgr.selection.building?.upgrade()
        })
        EventBroker.subscribe(EventKey.COMMAND_BUILDING_BEAMUP, () => {
            const building = entityMgr.selection.building
            if (!building) return
            for (let c = 0; c < building.stats.CostOre; c++) {
                MaterialSpawner.spawnMaterial(building.worldMgr, EntityType.ORE, building.primarySurface.getRandomPosition())
            }
            for (let c = 0; c < building.stats.CostCrystal; c++) {
                MaterialSpawner.spawnMaterial(building.worldMgr, EntityType.CRYSTAL, building.primarySurface.getRandomPosition())
            }
            building.carriedItems.forEach((m) => building.worldMgr.entityMgr.placeMaterial(m, building.primarySurface.getRandomPosition()))
            building.beamUp()
        })
        EventBroker.subscribe(EventKey.COMMAND_CHANGE_BUILDING_POWER_STATE, (event: ChangeBuildingPowerState) => {
            entityMgr.selection.building?.setPowerSwitch(event.state)
        })
        EventBroker.subscribe(EventKey.COMMAND_RAIDER_EAT, () => {
            entityMgr.selection.raiders.forEach((r) => !r.isDriving() && r.setJob(new EatJob()))
            EventBroker.publish(new DeselectAll())
        })
        EventBroker.subscribe(EventKey.COMMAND_RAIDER_UPGRADE, () => {
            entityMgr.selection.raiders.forEach((r) => {
                if (r.level >= r.stats.Levels) return
                const closestToolstation = r.findShortestPath(entityMgr.getRaiderUpgradePathTarget())?.target.building
                if (closestToolstation) r.setJob(new UpgradeRaiderJob(closestToolstation))
            })
            EventBroker.publish(new DeselectAll())
        })
        EventBroker.subscribe(EventKey.COMMAND_RAIDER_BEAMUP, () => {
            entityMgr.selection.raiders.forEach((r) => r.beamUp())
        })
        EventBroker.subscribe(EventKey.COMMAND_TRAIN_RAIDER, (event: TrainRaider) => {
            entityMgr.selection.raiders.forEach((r) => !r.hasTraining(event.training) && r.setJob(new TrainRaiderJob(entityMgr, event.training, undefined)))
            EventBroker.publish(new DeselectAll())
            return true
        })
        EventBroker.subscribe(EventKey.COMMAND_RAIDER_DROP, () => {
            entityMgr.selection.raiders.forEach((r) => r.stopJob())
        })
        EventBroker.subscribe(EventKey.COMMAND_SELECT_BUILD_MODE, (event: SelectBuildMode) => {
            sceneMgr.setBuildModeSelection(event.entityType)
        })
        EventBroker.subscribe(EventKey.COMMAND_CANCEL_BUILD_MODE, () => {
            sceneMgr.setBuildModeSelection(undefined)
        })
        EventBroker.subscribe(EventKey.COMMAND_CANCEL_CONSTRUCTION, () => {
            entityMgr.selection.surface?.site?.cancelSite()
        })
        EventBroker.subscribe(EventKey.COMMAND_VEHICLE_GET_MAN, () => {
            entityMgr.selection.vehicles.forEach((v) => {
                if (!v.callManJob && !v.driver) EventBroker.publish(new JobCreateEvent(new ManVehicleJob(v)))
            })
            EventBroker.publish(new DeselectAll())
        })
        EventBroker.subscribe(EventKey.COMMAND_VEHICLE_BEAMUP, () => {
            entityMgr.selection.vehicles.forEach((v) => {
                v.beamUp(true)
            })
            EventBroker.publish(new DeselectAll())
        })
        EventBroker.subscribe(EventKey.COMMAND_VEHICLE_DRIVER_GET_OUT, () => {
            entityMgr.selection.vehicles.forEach((v) => v.dropDriver())
            EventBroker.publish(new DeselectAll())
        })
        EventBroker.subscribe(EventKey.COMMAND_VEHICLE_UNLOAD, () => {
            entityMgr.selection.vehicles.forEach((v) => {
                v.stopJob()
                v.unloadVehicle()
            })
        })
        EventBroker.subscribe(EventKey.COMMAND_VEHICLE_LOAD, () => {
            entityMgr.selection.vehicles.forEach((v) => v.pickupNearbyEntity())
        })
        EventBroker.subscribe(EventKey.COMMAND_CAMERA_CONTROL, (event: CameraControl) => {
            if (event.args.zoom) {
                cameraControls.zoom(event.args.zoom)
            }
            if (event.args.cycleBuilding) {
                this.buildingCycleIndex = (this.buildingCycleIndex + 1) % entityMgr.buildings.length
                const target = entityMgr.buildings[this.buildingCycleIndex].primarySurface.getCenterWorld()
                cameraControls.jumpTo(target)
            }
            if (event.args.rotationIndex) cameraControls.rotate(event.args.rotationIndex)
            if (event.args.jumpToWorld) {
                const jumpTo = worldMgr.sceneMgr.terrain.getFloorPosition(event.args.jumpToWorld)
                cameraControls.jumpTo(jumpTo)
            }
        })
        EventBroker.subscribe(EventKey.FOLLOWER_SET_LOOK_AT, (event: FollowerSetLookAtEvent) => {
            const sceneEntity = worldMgr.ecs.getComponents(event.entity)?.get(AnimatedSceneEntityComponent)?.sceneEntity
            if (sceneEntity) cameraControls.jumpTo(sceneEntity.getWorldPosition(new Vector3()))
        })
        EventBroker.subscribe(EventKey.COMMAND_REPAIR_LAVA, () => {
            if (!entityMgr.selection.surface) return
            BuildingSite.createImproveSurfaceSite(worldMgr, entityMgr.selection.surface)
            EventBroker.publish(new DeselectAll())
        })
        EventBroker.subscribe(EventKey.COMMAND_PLAY_SOUND, (event: PlaySoundEvent) => {
            SoundManager.playSample(event.sample, event.isVoice)
        })
        EventBroker.subscribe(EventKey.COMMAND_REMOVE_SELECTION, () => {
            EventBroker.publish(new DeselectAll())
        })
        EventBroker.subscribe(EventKey.COMMAND_CHANGE_PREFERENCES, () => {
            SaveGameManager.savePreferences()
            SoundManager.setupSfxAudioTarget()
            const sfxVolume = SaveGameManager.getSfxVolume()
            SoundManager.playingAudio.forEach((a) => a.setVolume(sfxVolume))
            const gameSpeedIndex = Math.round(SaveGameManager.currentPreferences.gameSpeed * 5)
            worldMgr.gameSpeedMultiplier = [0.5, 0.75, 1, 1.5, 2, 2.5, 3][gameSpeedIndex] // XXX Publish speed change as event on network
        })
        EventBroker.subscribe(EventKey.COMMAND_UPGRADE_VEHICLE, (event: UpgradeVehicle) => {
            entityMgr.selection.assignUpgradeJob(event.upgrade)
            EventBroker.publish(new DeselectAll())
        })
        EventBroker.subscribe(EventKey.COMMAND_DROP_BIRD_SCARER, () => {
            entityMgr.selection.raiders.forEach((r) => {
                if (!r.hasTool(RaiderTool.BIRD_SCARER)) return
                r.removeTool(RaiderTool.BIRD_SCARER)
                if (r.selected) EventBroker.publish(new SelectionChanged(entityMgr))
                const birdScarer = worldMgr.ecs.addEntity()
                const position = r.getPosition()
                const heading = Math.random() * 2 * Math.PI
                const sceneEntity = new AnimatedSceneEntity()
                sceneEntity.position.copy(position)
                sceneEntity.rotation.y = heading
                sceneMgr.addSceneEntity(sceneEntity)
                sceneEntity.addAnimated(ResourceManager.getAnimatedData(GameConfig.instance.miscObjects.OohScary))
                sceneEntity.setAnimation(DynamiteActivity.Normal, () => {
                    sceneEntity.setAnimation(DynamiteActivity.TickDown, () => {
                        worldMgr.ecs.addComponent(birdScarer, new PositionComponent(position, r.getSurface()))
                        entityMgr.addEntity(birdScarer, EntityType.BIRD_SCARER)
                        sceneMgr.addMiscAnim(GameConfig.instance.miscObjects.BirdScarer, position, heading, false, () => {
                            sceneMgr.disposeSceneEntity(sceneEntity)
                            entityMgr.removeEntity(birdScarer)
                            worldMgr.ecs.removeEntity(birdScarer)
                        })
                    })
                })
            })
        })
        EventBroker.subscribe(EventKey.COMMAND_CAMERA_VIEW, (event: ChangeCameraEvent) => {
            const entity = entityMgr.selection.getPrimarySelected()
            if (!entity) {
                console.warn('No entity seems selected')
                return
            }
            if (event.viewMode === CameraViewMode.BIRD) {
                worldMgr.sceneMgr.setActiveCamera(worldMgr.sceneMgr.cameraBird)
            } else if (event.viewMode === CameraViewMode.FPV) {
                entity.sceneEntity.camFPVJoint.add(worldMgr.sceneMgr.cameraFPV)
                worldMgr.sceneMgr.setActiveCamera(worldMgr.sceneMgr.cameraFPV)
            } else if (event.viewMode === CameraViewMode.SHOULDER) {
                entity.sceneEntity.camShoulderJoint.add(worldMgr.sceneMgr.cameraShoulder)
                worldMgr.sceneMgr.setActiveCamera(worldMgr.sceneMgr.cameraShoulder)
            }
        })
    }
}
