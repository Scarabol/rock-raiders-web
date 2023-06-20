import { PositionalAudio } from 'three'
import { resetAudioSafe } from '../../../audio/AudioUtil'
import { Sample } from '../../../audio/Sample'
import { VehicleEntityStats } from '../../../cfg/GameStatsCfg'
import { EventBus } from '../../../event/EventBus'
import { SelectionChanged } from '../../../event/LocalEvents'
import { DEV_MODE, ITEM_ACTION_RANGE_SQ, NATIVE_UPDATE_INTERVAL } from '../../../params'
import { WorldManager } from '../../WorldManager'
import { AnimEntityActivity, RaiderActivity } from '../anim/AnimationActivity'
import { EntityStep } from '../EntityStep'
import { EntityType } from '../EntityType'
import { Job } from '../job/Job'
import { JobState } from '../job/JobState'
import { ManVehicleJob } from '../job/ManVehicleJob'
import { MoveJob } from '../job/raider/MoveJob'
import { Surface } from '../../terrain/Surface'
import { TerrainPath } from '../../terrain/TerrainPath'
import { MaterialEntity } from '../material/MaterialEntity'
import { MoveState } from '../MoveState'
import { PathTarget } from '../PathTarget'
import { Raider } from '../raider/Raider'
import { RaiderTool } from '../raider/RaiderTool'
import { RaiderTraining } from '../raider/RaiderTraining'
import { Updatable } from '../Updateable'
import { HealthComponent } from '../../component/HealthComponent'
import { HealthBarComponent } from '../../component/HealthBarComponent'
import { GameEntity } from '../../ECS'
import { BeamUpComponent } from '../../component/BeamUpComponent'
import { SelectionFrameComponent } from '../../component/SelectionFrameComponent'
import { MaterialSpawner } from '../../entity/MaterialSpawner'
import { AnimatedSceneEntity } from '../../../scene/AnimatedSceneEntity'
import { PositionComponent } from '../../component/PositionComponent'
import { ResourceManager } from '../../../resource/ResourceManager'
import { AnimatedSceneEntityComponent } from '../../component/AnimatedSceneEntityComponent'
import { VehicleUpgrade, VehicleUpgrades } from './VehicleUpgrade'

export class VehicleEntity implements Updatable {
    readonly entityType: EntityType
    readonly worldMgr: WorldManager
    readonly entity: GameEntity
    currentPath: TerrainPath = null
    level: number = 0
    job: Job = null
    followUpJob: Job = null
    workAudio: PositionalAudio
    stats: VehicleEntityStats
    sceneEntity: AnimatedSceneEntity
    driver: Raider = null
    callManJob: ManVehicleJob = null
    engineSound: PositionalAudio = null
    carriedItems: Set<MaterialEntity> = new Set()
    upgrades: Set<VehicleUpgrade> = new Set()

    constructor(entityType: EntityType, worldMgr: WorldManager, stats: VehicleEntityStats, aeNames: string[], readonly driverActivityStand: RaiderActivity = RaiderActivity.Stand, readonly driverActivityRoute: RaiderActivity = RaiderActivity.Stand) {
        this.entityType = entityType
        this.worldMgr = worldMgr
        this.stats = stats
        this.entity = this.worldMgr.ecs.addEntity()
        this.sceneEntity = new AnimatedSceneEntity()
        aeNames.forEach((aeName) => this.sceneEntity.addAnimated(ResourceManager.getAnimatedData(aeName)))
        this.worldMgr.ecs.addComponent(this.entity, new AnimatedSceneEntityComponent(this.sceneEntity))
        this.worldMgr.ecs.addComponent(this.entity, new HealthComponent())
        this.worldMgr.ecs.addComponent(this.entity, new HealthBarComponent(24, 14, this.sceneEntity, true))
        this.worldMgr.entityMgr.addEntity(this.entity, this.entityType)
    }

    update(elapsedMs: number) {
        this.work(elapsedMs)
    }

    beamUp() {
        this.dropDriver()
        this.worldMgr.ecs.addComponent(this.entity, new BeamUpComponent(this))
        const surface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(this.sceneEntity.position)
        for (let c = 0; c < this.stats.CostOre; c++) {
            MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.ORE, surface.getRandomPosition())
        }
        for (let c = 0; c < this.stats.CostCrystal; c++) {
            MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.CRYSTAL, surface.getRandomPosition())
        }
        this.worldMgr.entityMgr.vehicles.remove(this)
        this.worldMgr.entityMgr.vehiclesInBeam.add(this)
    }

    disposeFromWorld() {
        this.disposeFromScene()
        this.worldMgr.sceneMgr.removeMeshGroup(this.sceneEntity)
        this.workAudio = resetAudioSafe(this.workAudio)
        this.engineSound = resetAudioSafe(this.engineSound)
        this.worldMgr.entityMgr.vehicles.remove(this)
        this.worldMgr.entityMgr.vehiclesUndiscovered.remove(this)
        this.worldMgr.entityMgr.vehiclesInBeam.remove(this)
        this.engineSound = resetAudioSafe(this.engineSound)
        this.worldMgr.entityMgr.vehicles.remove(this)
        this.worldMgr.entityMgr.vehiclesUndiscovered.remove(this)
        this.worldMgr.entityMgr.vehiclesInBeam.remove(this)
        this.worldMgr.entityMgr.removeEntity(this.entity, this.entityType)
        this.worldMgr.ecs.removeEntity(this.entity)
    }

    disposeFromScene() {
        this.worldMgr.sceneMgr.removeMeshGroup(this.sceneEntity)
        this.sceneEntity.dispose()
    }

    /*
    Movement
     */

    findShortestPath(targets: PathTarget[] | PathTarget): TerrainPath {
        return this.worldMgr.sceneMgr.terrain.pathFinder.findShortestPath(this.sceneEntity.position2D, targets, this.stats, false)
    }

    private moveToClosestTarget(target: PathTarget, elapsedMs: number): MoveState {
        const result = this.moveToClosestTargetInternal(target, elapsedMs)
        if (result === MoveState.TARGET_UNREACHABLE) {
            console.warn('Entity could not move to job target, stopping job')
            this.stopJob()
        }
        return result
    }

    private moveToClosestTargetInternal(target: PathTarget, elapsedMs: number): MoveState {
        if (!target) return MoveState.TARGET_UNREACHABLE
        if (!this.currentPath || !target.targetLocation.equals(this.currentPath.target.targetLocation)) {
            const path = this.findShortestPath(target)
            this.currentPath = path && path.locations.length > 0 ? path : null
            if (!this.currentPath) return MoveState.TARGET_UNREACHABLE
        }
        const step = this.determineStep(elapsedMs)
        if (step.targetReached) {
            this.sceneEntity.headTowards(this.currentPath.target.getFocusPoint())
            return MoveState.TARGET_REACHED
        } else {
            this.sceneEntity.headTowards(this.currentPath.firstLocation)
            this.sceneEntity.position.add(step.vec)
            this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent).position.copy(this.sceneEntity.position)
            this.sceneEntity.setAnimation(AnimEntityActivity.Route)
            const angle = elapsedMs * this.getSpeed() / 1000 * 4 * Math.PI
            this.sceneEntity.wheelJoints.forEach((w) => w.radius && w.mesh.rotateX(angle / w.radius))
            return MoveState.MOVED
        }
    }

    private determineStep(elapsedMs: number): EntityStep {
        const targetWorld = this.worldMgr.sceneMgr.getFloorPosition(this.currentPath.firstLocation)
        targetWorld.y += this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent)?.floorOffset ?? 0
        const step = new EntityStep(targetWorld.sub(this.sceneEntity.position))
        const stepLengthSq = step.vec.lengthSq()
        const entitySpeed = this.getSpeed() * elapsedMs / NATIVE_UPDATE_INTERVAL // TODO use average speed between current and target position
        const entitySpeedSq = entitySpeed * entitySpeed
        if (this.currentPath.locations.length > 1) {
            if (stepLengthSq <= entitySpeedSq) {
                this.currentPath.locations.shift()
                return this.determineStep(elapsedMs)
            }
        }
        if (this.currentPath.target.targetLocation.distanceToSquared(this.sceneEntity.position2D) <= entitySpeedSq + this.currentPath.target.radiusSq + this.sceneEntity.getRadiusSquare() / 4) {
            step.targetReached = true
        }
        step.vec.clampLength(0, entitySpeed)
        return step
    }

    private getSpeed(): number {
        return this.stats.RouteSpeed[this.level]
    }

    /*
    Selection
     */

    get selected(): boolean {
        const selectionFrameComponent = this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)
        return selectionFrameComponent?.isSelected()
    }

    isInSelection(): boolean {
        return this.isSelectable() || this.selected
    }

    select(): boolean {
        if (!this.isSelectable()) return false
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.select()
        this.sceneEntity.setAnimation(AnimEntityActivity.Stand)
        return true
    }

    deselect() {
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.deselect()
    }

    isSelectable(): boolean {
        return !this.selected && !this.isInBeam()
    }

    isInBeam(): boolean {
        return this.worldMgr.ecs.getComponents(this.entity).has(BeamUpComponent)
    }

    /*
    Working on Jobs
     */

    stopJob() {
        this.workAudio = resetAudioSafe(this.workAudio)
        this.dropCarried()
        if (!this.job) return
        this.job.unAssign(this)
        if (this.followUpJob) this.followUpJob.unAssign(this)
        this.job = null
        this.followUpJob = null
        this.sceneEntity.setAnimation(AnimEntityActivity.Stand)
    }

    private work(elapsedMs: number) {
        if (!this.job || this.selected || this.isInBeam()) return
        if (this.job.jobState !== JobState.INCOMPLETE) {
            this.stopJob()
            return
        }
        const grabbedJobItem = this.grabJobItem(elapsedMs, this.job.carryItem)
        if (!grabbedJobItem) return
        const workplaceReached = this.moveToClosestTarget(this.job.getWorkplace(this), elapsedMs) === MoveState.TARGET_REACHED
        if (!workplaceReached) return
        if (!this.job.isReadyToComplete()) {
            this.sceneEntity.setAnimation(AnimEntityActivity.Stand)
            return
        }
        const workActivity = this.job.getWorkActivity() || AnimEntityActivity.Stand
        if (!this.workAudio && workActivity === RaiderActivity.Drill) { // TODO implement work audio
            this.workAudio = this.worldMgr.sceneMgr.addPositionalAudio(this.sceneEntity, Sample[Sample.SND_BIGDIGDRILL], true, true)
        }
        this.sceneEntity.setAnimation(workActivity, () => {
            this.completeJob()
        }, this.job.getExpectedTimeLeft())
        this.job?.addProgress(this, elapsedMs)
    }

    private completeJob() {
        this.workAudio = resetAudioSafe(this.workAudio)
        this.job?.onJobComplete()
        this.sceneEntity.setAnimation(AnimEntityActivity.Stand)
        if (this.job?.jobState === JobState.INCOMPLETE) return
        if (this.job) this.job.unAssign(this)
        this.job = this.followUpJob
        this.followUpJob = null
    }

    getDrillTimeSeconds(surface: Surface): number {
        if (!surface) return 0
        return (this.stats[surface.surfaceType.statsDrillName]?.[this.level] || 0)
    }

    setJob(job: Job, followUpJob: Job = null) {
        if (!this.driver) return
        if (this.job !== job) this.stopJob()
        this.job = job
        if (this.job) this.job.assign(this)
        this.followUpJob = followUpJob
        if (this.followUpJob) this.followUpJob.assign(this)
    }

    private grabJobItem(elapsedMs: number, carryItem: MaterialEntity): boolean {
        if (!carryItem || this.carriedItems.has(carryItem)) return true
        const positionAsPathTarget = PathTarget.fromLocation(carryItem.sceneEntity.position2D, ITEM_ACTION_RANGE_SQ)
        if (this.moveToClosestTarget(positionAsPathTarget, elapsedMs) === MoveState.TARGET_REACHED) {
            this.sceneEntity.setAnimation(AnimEntityActivity.Stand, () => {
                this.carriedItems.add(carryItem)
                this.sceneEntity.pickupEntity(carryItem.sceneEntity)
            })
        }
        return false
    }

    dropCarried() {
        if (this.carriedItems.size < 1) return
        this.sceneEntity.removeAllCarried()
        this.carriedItems.forEach((carried) => {
            const floorPosition = carried.worldMgr.sceneMgr.terrain.getFloorPosition(carried.sceneEntity.position2D)
            carried.sceneEntity.position.copy(floorPosition)
            carried.worldMgr.sceneMgr.addMeshGroup(carried.sceneEntity)
        })
        this.carriedItems.clear()
    }

    addDriver(driver: Raider) {
        this.driver = driver
        this.driver.vehicle = this
        if (!this.stats.InvisibleDriver) {
            this.sceneEntity.addDriver(this.driver.sceneEntity)
        } else {
            this.worldMgr.sceneMgr.removeMeshGroup(this.driver.sceneEntity)
        }
        if (this.stats.EngineSound && !this.engineSound && !DEV_MODE) this.engineSound = this.worldMgr.sceneMgr.addPositionalAudio(this.sceneEntity, this.stats.EngineSound, true, true)
        if (this.selected) EventBus.publishEvent(new SelectionChanged(this.worldMgr.entityMgr))
    }

    dropDriver() {
        this.stopJob()
        if (!this.driver) return
        this.sceneEntity.removeDriver()
        this.driver.vehicle = null
        this.driver.sceneEntity.position.copy(this.driver.worldMgr.sceneMgr.getFloorPosition(this.sceneEntity.position2D))
        this.driver.worldMgr.ecs.getComponents(this.driver.entity).get(PositionComponent).position.copy(this.driver.sceneEntity.position)
        this.driver.sceneEntity.rotation.y = this.sceneEntity.getHeading()
        this.driver.sceneEntity.visible = this.driver.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(this.driver.sceneEntity.position).discovered
        this.driver.worldMgr.sceneMgr.addMeshGroup(this.driver.sceneEntity)
        this.driver.sceneEntity.setAnimation(this.driver.getDefaultAnimationName())
        this.driver = null
        this.engineSound = resetAudioSafe(this.engineSound)
        if (this.selected) EventBus.publishEvent(new SelectionChanged(this.worldMgr.entityMgr))
    }

    getDefaultAnimationName() {
        return AnimEntityActivity.Stand
    }

    getRequiredTraining(): RaiderTraining {
        if (this.stats.CrossLand && !this.stats.CrossLava && !this.stats.CrossWater) {
            return RaiderTraining.DRIVER
        } else if (this.stats.CrossWater) {
            return RaiderTraining.SAILOR
        }
        return RaiderTraining.PILOT
    }

    isPrepared(job: Job): boolean {
        const carryType = job.carryItem?.entityType
        return (job.getRequiredTool() === RaiderTool.DRILL && this.canDrill(job.surface))
            || (job.getRequiredTool() === RaiderTool.SHOVEL && this.canClear())
            || ((carryType === EntityType.ORE || carryType === EntityType.CRYSTAL || carryType === EntityType.ELECTRIC_FENCE) && this.hasCapacity())
    }

    doubleSelect(): boolean {
        if (!this.selected || !this.stats.CanDoubleSelect || !this.driver) return false
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.doubleSelect()
        return true
    }

    canDrill(surface: Surface): boolean {
        return this.getDrillTimeSeconds(surface) > 0
    }

    canClear(): boolean {
        return !!this.stats.CanClearRubble
    }

    hasCapacity(): boolean {
        return this.carriedItems.size < this.getCarryCapacity()
    }

    isReadyToTakeAJob(): boolean {
        return !this.job && !this.selected && !this.isInBeam() && !!this.driver
    }

    getCarryCapacity(): number {
        return this.stats.MaxCarry?.[this.level] || 0
    }

    unblockTeleporter() {
        const surface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(this.sceneEntity.position)
        const blockedTeleporter = !!surface.building?.teleport && surface.building?.primaryPathSurface === surface
        if (blockedTeleporter) {
            const walkableNeighbor = surface.neighbors.find((n) => !n.site && n.isWalkable() && !n.building?.teleport)
            if (walkableNeighbor) this.setJob(new MoveJob(walkableNeighbor.getCenterWorld2D()))
        }
    }

    getDriverActivity() {
        return this.sceneEntity.currentAnimation === AnimEntityActivity.Stand ? this.driverActivityStand : this.driverActivityRoute
    }

    canUpgrade(upgrade: VehicleUpgrade): boolean {
        if (this.upgrades.has(upgrade)) return false
        const upgraded = new Set([...this.upgrades, upgrade])
        const nextUpgradeLevel = VehicleUpgrades.toUpgradeString(upgraded)
        return this.sceneEntity.animationData.some((animEntityData) => animEntityData.upgradesByLevel.get(nextUpgradeLevel))
    }

    addUpgrade(upgrade: VehicleUpgrade) {
        this.upgrades.add(upgrade)
        const upgradeLevel = VehicleUpgrades.toUpgradeString(this.upgrades)
        this.sceneEntity.setUpgradeLevel(upgradeLevel)
        this.level = parseInt(upgradeLevel, 2)
    }
}
