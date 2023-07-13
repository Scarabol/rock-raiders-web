import { PositionalAudio, Vector2, Vector3 } from 'three'
import { resetAudioSafe } from '../../../audio/AudioUtil'
import { Sample } from '../../../audio/Sample'
import { VehicleEntityStats } from '../../../cfg/GameStatsCfg'
import { EventBus } from '../../../event/EventBus'
import { SelectionChanged, UpdateRadarEntities } from '../../../event/LocalEvents'
import { DEV_MODE, ITEM_ACTION_RANGE_SQ, NATIVE_UPDATE_INTERVAL } from '../../../params'
import { WorldManager } from '../../WorldManager'
import { AnimEntityActivity, RaiderActivity, RockMonsterActivity } from '../anim/AnimationActivity'
import { EntityStep } from '../EntityStep'
import { EntityType } from '../EntityType'
import { Job, JobFulfiller } from '../job/Job'
import { JobState } from '../job/JobState'
import { ManVehicleJob } from '../job/ManVehicleJob'
import { MoveJob } from '../job/MoveJob'
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
import { GameEntity } from '../../ECS'
import { BeamUpComponent } from '../../component/BeamUpComponent'
import { SelectionFrameComponent } from '../../component/SelectionFrameComponent'
import { AnimatedSceneEntity } from '../../../scene/AnimatedSceneEntity'
import { PositionComponent } from '../../component/PositionComponent'
import { ResourceManager } from '../../../resource/ResourceManager'
import { AnimatedSceneEntityComponent } from '../../component/AnimatedSceneEntityComponent'
import { VehicleUpgrade, VehicleUpgrades } from './VehicleUpgrade'
import { GenericDeathEvent } from '../../../event/WorldLocationEvent'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { RockMonsterBehaviorComponent } from '../../component/RockMonsterBehaviorComponent'
import { LastWillComponent } from '../../component/LastWillComponent'
import { RaiderScareComponent, RaiderScareRange } from '../../component/RaiderScareComponent'

export class VehicleEntity implements Updatable, JobFulfiller {
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
        this.sceneEntity = new AnimatedSceneEntity(this.worldMgr.sceneMgr.audioListener)
        aeNames.forEach((aeName) => this.sceneEntity.addAnimated(ResourceManager.getAnimatedData(aeName)))
        this.worldMgr.ecs.addComponent(this.entity, new AnimatedSceneEntityComponent(this.sceneEntity))
        this.worldMgr.ecs.addComponent(this.entity, new HealthComponent(false, 24, 14, this.sceneEntity, false))
        this.worldMgr.ecs.addComponent(this.entity, new LastWillComponent(() => {
            EventBus.publishEvent(new GenericDeathEvent(this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent)))
            this.beamUp()
        }))
        this.worldMgr.entityMgr.addEntity(this.entity, this.entityType)
    }

    update(elapsedMs: number) {
        if (!this.job || this.selected || this.isInBeam()) return
        this.work(elapsedMs)
    }

    beamUp() {
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.deselect()
        this.worldMgr.ecs.removeComponent(this.entity, SelectionFrameComponent)
        this.worldMgr.ecs.addComponent(this.entity, new BeamUpComponent(this))
        if (this.driver) this.worldMgr.entityMgr.removeEntity(this.driver.entity)
        this.worldMgr.entityMgr.removeEntity(this.entity)
    }

    disposeFromWorld() {
        this.disposeFromScene()
        this.worldMgr.sceneMgr.removeMeshGroup(this.sceneEntity)
        this.workAudio = resetAudioSafe(this.workAudio)
        this.engineSound = resetAudioSafe(this.engineSound)
        this.worldMgr.entityMgr.removeEntity(this.entity)
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
        return this.worldMgr.sceneMgr.terrain.pathFinder.findShortestPath(this.getPosition2D(), targets, this.stats, false)
    }

    private moveToClosestTarget(target: PathTarget, elapsedMs: number): MoveState {
        const result = this.moveToClosestTargetInternal(target, elapsedMs)
        if (result === MoveState.MOVED) {
            const vehiclePosition2D = this.sceneEntity.position2D
            this.worldMgr.entityMgr.rockMonsters.forEach((rocky) => {
                const components = this.worldMgr.ecs.getComponents(rocky)
                const rockySceneEntity = components.get(AnimatedSceneEntityComponent).sceneEntity
                if (rockySceneEntity.currentAnimation === RockMonsterActivity.Unpowered) {
                    const positionComponent = components.get(PositionComponent)
                    const rockyPosition2D = positionComponent.getPosition2D()
                    if (vehiclePosition2D.distanceToSquared(rockyPosition2D) < 25 * 25) { // TODO Use WakeRadius from monster stats
                        rockySceneEntity.setAnimation(RockMonsterActivity.WakeUp, () => {
                            this.worldMgr.ecs.addComponent(rocky, new RaiderScareComponent(RaiderScareRange.ROCKY))
                            this.worldMgr.ecs.addComponent(rocky, new RockMonsterBehaviorComponent())
                        })
                    }
                }
            })
        } else if (result === MoveState.TARGET_UNREACHABLE) {
            console.warn('Vehicle could not move to job target, stopping job', this.job, target)
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
            if (target.building) this.sceneEntity.headTowards(target.building.primarySurface.getCenterWorld2D())
            return MoveState.TARGET_REACHED
        } else {
            this.sceneEntity.headTowards(this.currentPath.firstLocation)
            this.setPosition(this.getPosition().add(step.vec))
            this.sceneEntity.setAnimation(AnimEntityActivity.Route)
            EventBus.publishEvent(new UpdateRadarEntities(this.worldMgr.entityMgr)) // TODO only send map updates not all
            const angle = elapsedMs * this.getSpeed() / 1000 * 4 * Math.PI
            this.sceneEntity.wheelJoints.forEach((w) => w.radius && w.mesh.rotateX(angle / w.radius))
            return MoveState.MOVED
        }
    }

    private determineStep(elapsedMs: number): EntityStep {
        const targetWorld = this.worldMgr.sceneMgr.getFloorPosition(this.currentPath.firstLocation)
        targetWorld.y += this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent)?.floorOffset ?? 0
        const step = new EntityStep(targetWorld.sub(this.getPosition()))
        const stepLengthSq = step.vec.lengthSq()
        const entitySpeed = this.getSpeed() * elapsedMs / NATIVE_UPDATE_INTERVAL // TODO use average speed between current and target position
        const entitySpeedSq = entitySpeed * entitySpeed
        if (this.currentPath.locations.length > 1) {
            if (stepLengthSq <= entitySpeedSq) {
                this.currentPath.locations.shift()
                return this.determineStep(elapsedMs)
            }
        }
        if (this.currentPath.target.targetLocation.distanceToSquared(this.getPosition2D()) <= this.currentPath.target.radiusSq) {
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
        this.workAudio = resetAudioSafe(this.workAudio)
        return true
    }

    deselect() {
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.deselect()
    }

    isSelectable(): boolean {
        return !this.selected && !this.isInBeam()
    }

    isInBeam(): boolean {
        return !this.worldMgr.ecs.getComponents(this.entity).has(SelectionFrameComponent)
    }

    /*
    Working on Jobs
     */

    stopJob() {
        this.workAudio = resetAudioSafe(this.workAudio)
        this.dropCarried(false)
        if (!this.job) return
        this.job.unAssign(this)
        if (this.followUpJob) this.followUpJob.unAssign(this)
        this.job = null
        this.followUpJob = null
        this.sceneEntity.setAnimation(AnimEntityActivity.Stand)
    }

    private work(elapsedMs: number) {
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
        if (!this.workAudio && this.job.workSoundVehicle) {
            this.workAudio = this.worldMgr.sceneMgr.addPositionalAudio(this.sceneEntity, Sample[this.job.workSoundVehicle], true, true)
        }
        if (workActivity === RaiderActivity.Drill) {
            this.sceneEntity.headTowards(this.job.surface.getCenterWorld2D())
            this.sceneEntity.setAnimation(workActivity)
            this.job?.addProgress(this, elapsedMs)
        } else if (workActivity === RaiderActivity.Stand) {
            this.sceneEntity.setAnimation(workActivity)
            this.completeJob()
        } else {
            this.sceneEntity.setAnimation(workActivity, () => {
                this.completeJob()
            }, this.job.getExpectedTimeLeft())
        }
    }

    private completeJob() {
        this.workAudio = resetAudioSafe(this.workAudio)
        this.job?.onJobComplete(this)
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
        const positionAsPathTarget = PathTarget.fromLocation(carryItem.getPosition2D(), ITEM_ACTION_RANGE_SQ)
        if (this.moveToClosestTarget(positionAsPathTarget, elapsedMs) === MoveState.TARGET_REACHED) {
            this.sceneEntity.setAnimation(AnimEntityActivity.Stand, () => {
                this.carriedItems.add(carryItem)
                this.sceneEntity.pickupEntity(carryItem.sceneEntity)
            }, 500)
        }
        return false
    }

    dropCarried(unAssignFromSite: boolean) {
        if (this.carriedItems.size < 1) return
        if (unAssignFromSite) this.carriedItems.forEach((i) => i.carryJob?.target?.site?.unAssign(i))
        this.sceneEntity.removeAllCarried()
        this.carriedItems.forEach((carried) => {
            const floorPosition = carried.worldMgr.sceneMgr.terrain.getFloorPosition(carried.getPosition2D())
            carried.setPosition(floorPosition)
            carried.worldMgr.sceneMgr.addMeshGroup(carried.sceneEntity)
        })
        this.carriedItems.clear()
    }

    addDriver(driver: Raider) {
        this.driver = driver
        this.driver.vehicle = this
        if (this.stats.InvisibleDriver) {
            this.worldMgr.sceneMgr.removeMeshGroup(this.driver.sceneEntity)
        } else {
            this.worldMgr.ecs.getComponents(this.driver.entity).get(PositionComponent).position.set(0, 0, 0)
            this.sceneEntity.addDriver(this.driver.sceneEntity)
            // TODO sync idle animation of vehicle and driver
        }
        if (this.stats.EngineSound && !this.engineSound && !DEV_MODE) this.engineSound = this.worldMgr.sceneMgr.addPositionalAudio(this.sceneEntity, this.stats.EngineSound, true, true)
        if (this.selected) EventBus.publishEvent(new SelectionChanged(this.worldMgr.entityMgr))
    }

    dropDriver() {
        this.stopJob()
        if (!this.driver) return
        this.sceneEntity.removeDriver()
        this.driver.vehicle = null
        const surface = this.getSurface()
        const walkableSurface = [surface, ...surface.neighbors].find((s) => s.isWalkable())
        const hopOffSpot = walkableSurface.getRandomPosition() // XXX find spot close to the possibly non-walkable actual surface
        this.driver.setPosition(this.driver.worldMgr.sceneMgr.getFloorPosition(hopOffSpot))
        this.driver.sceneEntity.rotation.y = this.sceneEntity.heading
        this.driver.worldMgr.sceneMgr.addMeshGroup(this.driver.sceneEntity)
        this.driver.sceneEntity.setAnimation(RaiderActivity.Stand)
        this.driver = null
        this.engineSound = resetAudioSafe(this.engineSound)
        if (this.selected) EventBus.publishEvent(new SelectionChanged(this.worldMgr.entityMgr))
    }

    getRequiredTraining(): RaiderTraining {
        if (this.stats.CrossLand && !this.stats.CrossLava && !this.stats.CrossWater) {
            return RaiderTraining.DRIVER
        } else if (!this.stats.CrossLand && !this.stats.CrossLava && this.stats.CrossWater) {
            return RaiderTraining.SAILOR
        }
        return RaiderTraining.PILOT
    }

    isPrepared(job: Job): boolean {
        const carryType = job.carryItem?.entityType
        return (job.requiredTool === RaiderTool.DRILL && this.canDrill(job.surface))
            || (job.priorityIdentifier === PriorityIdentifier.CLEARING && this.canClear())
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
        const surface = this.getSurface()
        const blockedTeleporter = surface.building?.primaryPathSurface === surface &&
            surface.building?.teleport?.teleportedEntityTypes.some((t) => t !== EntityType.PILOT)
        if (blockedTeleporter) {
            const walkableNeighbor = surface.neighbors.find((n) => !n.site && n.isWalkable() && !n.building?.teleport)
            if (walkableNeighbor) this.setJob(new MoveJob(this, walkableNeighbor.getCenterWorld2D()))
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

    getRepairValue(): number {
        return 0
    }

    getPosition(): Vector3 {
        return this.sceneEntity.position.clone()
    }

    getPosition2D(): Vector2 {
        return this.sceneEntity.position2D
    }

    setPosition(position: Vector3) {
        this.sceneEntity.position.copy(position)
        const surface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(position)
        this.sceneEntity.visible = surface.discovered
        const positionComponent = this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent)
        if (positionComponent) {
            positionComponent.position.copy(position)
            positionComponent.surface = surface
            this.sceneEntity.position.y += positionComponent.floorOffset
        }
    }

    getSurface(): Surface {
        return this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(this.getPosition())
    }
}
