import { PositionalAudio } from 'three'
import { resetAudioSafe } from '../../../audio/AudioUtil'
import { Sample } from '../../../audio/Sample'
import { EventBus } from '../../../event/EventBus'
import { RaidersAmountChangedEvent, UpdateRadarEntities } from '../../../event/LocalEvents'
import { ITEM_ACTION_RANGE_SQ, NATIVE_UPDATE_INTERVAL, RAIDER_CARRY_SLOWDOWN, SPIDER_SLIP_RANGE_SQ, TILESIZE } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { WorldManager } from '../../WorldManager'
import { AnimationActivity, AnimEntityActivity, RaiderActivity } from '../anim/AnimationActivity'
import { EntityStep } from '../EntityStep'
import { Job } from '../job/Job'
import { JobState } from '../job/JobState'
import { Surface } from '../../terrain/Surface'
import { TerrainPath } from '../../terrain/TerrainPath'
import { MaterialEntity } from '../material/MaterialEntity'
import { MoveState } from '../MoveState'
import { PathTarget } from '../PathTarget'
import { Updatable } from '../Updateable'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { RaiderTool } from './RaiderTool'
import { RaiderTraining } from './RaiderTraining'
import { EntityType } from '../EntityType'
import { GameEntity } from '../../ECS'
import { HealthComponent } from '../../component/HealthComponent'
import { HealthBarComponent } from '../../component/HealthBarComponent'
import { PositionComponent } from '../../component/PositionComponent'
import { BeamUpComponent } from '../../component/BeamUpComponent'
import { AnimatedSceneEntityComponent } from '../../component/AnimatedSceneEntityComponent'
import { SelectionFrameComponent } from '../../component/SelectionFrameComponent'
import { AnimatedSceneEntity } from '../../../scene/AnimatedSceneEntity'
import { OxygenComponent } from '../../component/OxygenComponent'
import { GenericDeathEvent } from '../../../event/WorldLocationEvent'
import { RaiderInfoComponent } from '../../component/RaiderInfoComponent'
import { RunPanicJob } from '../job/raider/RunPanicJob'

export class Raider implements Updatable {
    readonly entityType: EntityType = EntityType.PILOT
    readonly entity: GameEntity
    readonly infoComponent: RaiderInfoComponent
    worldMgr: WorldManager
    currentPath: TerrainPath = null
    level: number = 0
    job: Job = null
    followUpJob: Job = null
    workAudio: PositionalAudio
    sceneEntity: AnimatedSceneEntity
    tools: Map<RaiderTool, boolean> = new Map()
    trainings: Map<RaiderTraining, boolean> = new Map()
    carries: MaterialEntity = null
    slipped: boolean = false
    foodLevel: number = 1
    vehicle: VehicleEntity = null
    scared: boolean = false

    constructor(worldMgr: WorldManager) {
        this.worldMgr = worldMgr
        this.tools.set(RaiderTool.DRILL, true)
        this.entity = this.worldMgr.ecs.addEntity()
        this.sceneEntity = new AnimatedSceneEntity()
        this.sceneEntity.addAnimated(ResourceManager.getAnimatedData('mini-figures/pilot'))
        this.worldMgr.ecs.addComponent(this.entity, new AnimatedSceneEntityComponent(this.sceneEntity))
        this.worldMgr.ecs.addComponent(this.entity, new HealthComponent())
        this.worldMgr.ecs.addComponent(this.entity, new HealthBarComponent(16, 10, this.sceneEntity, true))
        this.worldMgr.ecs.addComponent(this.entity, new OxygenComponent(this.stats.OxygenCoef))
        this.infoComponent = this.worldMgr.ecs.addComponent(this.entity, new RaiderInfoComponent(this.sceneEntity))
        this.worldMgr.entityMgr.addEntity(this.entity, this.entityType)
    }

    get stats() {
        return ResourceManager.configuration.stats.pilot
    }

    update(elapsedMs: number) {
        const components = this.worldMgr.ecs.getComponents(this.entity)
        const health = components.get(HealthComponent).health
        if (health <= 0 && !components.has(BeamUpComponent)) {
            EventBus.publishEvent(new GenericDeathEvent(this.sceneEntity.position))
            this.beamUp()
            return
        }
        if (this.slipped) return
        if (this.vehicle) {
            this.sceneEntity.setAnimation(this.vehicle.getDriverActivity())
            return
        }
        if (this.selected || this.isInBeam()) return
        this.checkScared()
        if (!this.job) return
        this.work(elapsedMs)
    }

    private checkScared() {
        if (this.scared) return
        this.worldMgr.entityMgr.raiderScare.forEach((scare) => {
            const distanceSq = scare.getPosition2D().distanceToSquared(this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent).getPosition2D())
            if (distanceSq < 80 * 80) {
                this.scared = true
                this.sceneEntity.setAnimation(RaiderActivity.RunPanic)
                this.dropCarried(true)
                const runTarget = this.sceneEntity.position2D.add(this.sceneEntity.position2D.sub(scare.getPosition2D()))
                this.setJob(new RunPanicJob(runTarget))
            }
        })
    }

    isDriving(): boolean {
        return !!this.vehicle
    }

    beamUp() {
        this.stopJob()
        this.worldMgr.ecs.addComponent(this.entity, new BeamUpComponent(this))
        EventBus.publishEvent(new RaidersAmountChangedEvent(this.worldMgr.entityMgr))
    }

    disposeFromWorld() {
        this.disposeFromScene()
        this.workAudio = resetAudioSafe(this.workAudio)
        this.worldMgr.entityMgr.raiders.remove(this)
        this.worldMgr.entityMgr.raidersUndiscovered.remove(this)
        this.worldMgr.entityMgr.raidersInBeam.remove(this)
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
        return this.worldMgr.sceneMgr.terrain.pathFinder.findShortestPath(this.sceneEntity.position2D, targets, this.stats, true)
    }

    private moveToClosestTarget(target: PathTarget, elapsedMs: number): MoveState {
        const result = this.moveToClosestTargetInternal(target, elapsedMs)
        if (result === MoveState.MOVED) {
            this.worldMgr.entityMgr.spiders.some((spider) => { // TODO optimize this with a quad tree or similar
                const raiderPosition2D = this.sceneEntity.position2D
                const components = this.worldMgr.ecs.getComponents(spider)
                const spiderPosition2D = components.get(PositionComponent).getPosition2D()
                if (raiderPosition2D.distanceToSquared(spiderPosition2D) < SPIDER_SLIP_RANGE_SQ) {
                    this.slip()
                    this.worldMgr.entityMgr.removeEntity(spider, EntityType.SMALL_SPIDER)
                    this.worldMgr.ecs.removeEntity(spider)
                    const sceneEntityComponent = components.get(AnimatedSceneEntityComponent)
                    if (sceneEntityComponent) {
                        this.worldMgr.sceneMgr.removeMeshGroup(sceneEntityComponent.sceneEntity)
                        sceneEntityComponent.sceneEntity.dispose()
                    }
                    return true
                }
                return false
            })
        } else if (result === MoveState.TARGET_UNREACHABLE) {
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
            const positionComponent = this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent)
            positionComponent.position.copy(this.sceneEntity.position)
            positionComponent.surface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(this.sceneEntity.position)
            this.sceneEntity.setAnimation(this.getRouteActivity())
            EventBus.publishEvent(new UpdateRadarEntities(this.worldMgr.entityMgr)) // TODO only send map updates not all
            if (this.foodLevel > 0) this.foodLevel -= step.vec.lengthSq() / TILESIZE / TILESIZE / 5
            this.infoComponent.setHungerIndicator(this.foodLevel)
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
        if (this.currentPath.target.targetLocation.distanceToSquared(this.sceneEntity.position2D) <= this.currentPath.target.radiusSq) {
            step.targetReached = true
        }
        step.vec.clampLength(0, entitySpeed)
        return step
    }

    private getSpeed(): number {
        return this.stats.RouteSpeed[this.level] * (this.isOnPath() ? this.stats.PathCoef : 1) * (this.isOnRubble() ? this.stats.RubbleCoef : 1) * (!!this.carries ? RAIDER_CARRY_SLOWDOWN : 1)
    }

    private getRouteActivity(): AnimationActivity {
        if (this.isOnRubble()) {
            return !!this.carries ? RaiderActivity.CarryRubble : RaiderActivity.routeRubble
        } else {
            return !!this.carries ? RaiderActivity.Carry : AnimEntityActivity.Route
        }
    }

    private isOnPath(): boolean {
        return this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(this.sceneEntity.position).isPath()
    }

    private isOnRubble() {
        return this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(this.sceneEntity.position).hasRubble()
    }

    private slip() {
        if (Math.randomInclusive(0, 100) < 10) this.stopJob()
        this.dropCarried(true)
        this.slipped = true
        this.sceneEntity.setAnimation(RaiderActivity.Slip, () => {
            this.slipped = false
        })
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
        this.sceneEntity.setAnimation(this.getDefaultAnimationName())
        return true
    }

    private getDefaultAnimationName(): AnimationActivity {
        return this.carries ? RaiderActivity.CarryStand : RaiderActivity.Stand
    }

    deselect() {
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.deselect()
    }

    isSelectable(): boolean {
        return !this.selected && !this.isInBeam() && !this.slipped && !this.vehicle
    }

    private isInBeam(): boolean {
        return this.worldMgr.ecs.getComponents(this.entity).has(BeamUpComponent)
    }

    /*
    Working on Jobs
     */

    setJob(job: Job, followUpJob: Job = null) {
        if (this.job !== job) this.stopJob()
        this.job = job
        this.infoComponent.setBubbleTexture(this.job.getJobBubble())
        if (this.job) this.job.assign(this)
        this.followUpJob = followUpJob
        if (this.followUpJob) this.followUpJob.assign(this)
    }

    getDrillTimeSeconds(surface: Surface): number {
        if (!surface || !this.hasTool(RaiderTool.DRILL)) return 0
        return (this.stats[surface.surfaceType.statsDrillName]?.[this.level] || 0)
    }

    stopJob() {
        this.dropCarried(false)
        this.workAudio = resetAudioSafe(this.workAudio)
        if (!this.job) return
        this.job.unAssign(this)
        if (this.followUpJob) this.followUpJob.unAssign(this)
        this.job = null
        this.followUpJob = null
        this.sceneEntity.setAnimation(this.getDefaultAnimationName())
        this.infoComponent.setBubbleTexture('bubbleIdle')
    }

    dropCarried(unAssignFromSite: boolean): void {
        if (!this.carries) return
        if (unAssignFromSite) this.carries.carryJob?.target?.site?.unAssign(this.carries)
        this.sceneEntity.removeAllCarried()
        const floorPosition = this.carries.worldMgr.sceneMgr.getFloorPosition(this.carries.sceneEntity.position2D)
        this.carries.sceneEntity.position.copy(floorPosition)
        this.carries.worldMgr.sceneMgr.addMeshGroup(this.carries.sceneEntity)
        this.carries = null
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
            this.sceneEntity.setAnimation(this.getDefaultAnimationName())
            return
        }
        const workActivity = this.job.getWorkActivity() || this.getDefaultAnimationName()
        if (!this.workAudio) {
            if (workActivity === RaiderActivity.Drill) { // TODO implement work audio
                this.workAudio = this.worldMgr.sceneMgr.addPositionalAudio(this.sceneEntity, Sample[Sample.SFX_Drill], true, true)
            } else if (workActivity === RaiderActivity.Place) {
                let sample = Sample.SFX_Place
                const carriedEntityType = this.job.carryItem.entityType
                if (carriedEntityType === EntityType.ORE || carriedEntityType === EntityType.BRICK) {
                    sample = Sample.SFX_PlaceOre
                } else if (carriedEntityType === EntityType.CRYSTAL) {
                    sample = Sample.SFX_PlaceCrystal
                }
                this.workAudio = this.worldMgr.sceneMgr.addPositionalAudio(this.sceneEntity, Sample[sample], true, false)
            } else if (workActivity === RaiderActivity.Clear) {
                this.workAudio = this.worldMgr.sceneMgr.addPositionalAudio(this.sceneEntity, Sample[Sample.SND_dig], true, true)
            }
        }
        if (workActivity === RaiderActivity.Drill) {
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
        if (this.workAudio?.loop) this.workAudio = resetAudioSafe(this.workAudio)
        else this.workAudio = null
        this.job?.onJobComplete(this)
        this.sceneEntity.setAnimation(this.getDefaultAnimationName())
        this.infoComponent.setBubbleTexture('bubbleIdle')
        if (this.job?.jobState === JobState.INCOMPLETE) return
        if (this.job) this.job.unAssign(this)
        this.job = this.followUpJob
        this.followUpJob = null
    }

    private grabJobItem(elapsedMs: number, carryItem: MaterialEntity): boolean {
        if (this.carries === carryItem) return true
        this.dropCarried(true)
        if (!carryItem) return true
        const positionAsPathTarget = PathTarget.fromLocation(carryItem.sceneEntity.position2D, ITEM_ACTION_RANGE_SQ)
        if (this.moveToClosestTarget(positionAsPathTarget, elapsedMs) === MoveState.TARGET_REACHED) {
            this.sceneEntity.setAnimation(RaiderActivity.Collect, () => {
                carryItem.carryJob?.target?.site?.assign(carryItem)
                this.carries = carryItem
                this.sceneEntity.pickupEntity(carryItem.sceneEntity)
            })
        }
        return false
    }

    hasTool(tool: RaiderTool) {
        return !tool || this.tools.has(tool)
    }

    hasTraining(training: RaiderTraining) {
        return !training || this.trainings.has(training)
    }

    addTool(tool: RaiderTool) {
        this.tools.set(tool, true)
    }

    addTraining(training: RaiderTraining) {
        this.trainings.set(training, true)
    }

    isPrepared(job: Job): boolean {
        if (job.getRequiredTool() === RaiderTool.DRILL) return this.canDrill(job.surface)
        return this.hasTool(job.getRequiredTool()) && this.hasTraining(job.getRequiredTraining()) && this.hasCapacity()
    }

    canDrill(surface: Surface): boolean {
        return this.getDrillTimeSeconds(surface) > 0
    }

    hasCapacity(): boolean {
        return !this.carries
    }

    isReadyToTakeAJob(): boolean {
        return !this.job && !this.selected && !this.isInBeam() && !this.slipped
    }

    maxTools(): number {
        return this.stats.NumOfToolsCanCarry[this.level] ?? 2
    }
}
