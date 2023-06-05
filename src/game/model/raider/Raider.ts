import { PositionalAudio, Vector2 } from 'three'
import { resetAudioSafe } from '../../../audio/AudioUtil'
import { Sample } from '../../../audio/Sample'
import { EventBus } from '../../../event/EventBus'
import { RaidersAmountChangedEvent, UpdateRadarEntities } from '../../../event/LocalEvents'
import { ITEM_ACTION_RANGE_SQ, NATIVE_UPDATE_INTERVAL, RAIDER_CARRY_SLOWDOWN, SPIDER_SLIP_RANGE_SQ } from '../../../params'
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

export class Raider implements Updatable {
    readonly entityType: EntityType = EntityType.PILOT
    readonly entity: GameEntity
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
    hungerLevel: number = 1
    vehicle: VehicleEntity = null

    constructor(worldMgr: WorldManager) {
        this.worldMgr = worldMgr
        this.tools.set(RaiderTool.DRILL, true)
        this.entity = this.worldMgr.ecs.addEntity()
        this.sceneEntity = new AnimatedSceneEntity()
        this.sceneEntity.addAnimated(ResourceManager.getAnimatedData('mini-figures/pilot'))
        this.worldMgr.ecs.addComponent(this.entity, new AnimatedSceneEntityComponent(this.sceneEntity))
        this.worldMgr.ecs.addComponent(this.entity, new HealthComponent())
        this.worldMgr.ecs.addComponent(this.entity, new HealthBarComponent(16, 10, this.sceneEntity, true))
        this.worldMgr.entityMgr.addEntity(this.entity, this.entityType)
    }

    get stats() {
        return ResourceManager.configuration.stats.pilot
    }

    update(elapsedMs: number) {
        this.work(elapsedMs)
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

    addToScene(worldPosition: Vector2, headingRad: number) {
        if (worldPosition) {
            this.sceneEntity.position.copy(this.worldMgr.sceneMgr.getFloorPosition(worldPosition))
        }
        if (headingRad !== undefined && headingRad !== null) {
            this.sceneEntity.rotation.y = headingRad
        }
        this.sceneEntity.visible = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(this.sceneEntity.position).discovered
        this.worldMgr.sceneMgr.addMeshGroup(this.sceneEntity)
    }

    /*
    Movement
     */

    findPathToTarget(target: PathTarget): TerrainPath {
        if (!target) return null
        return new TerrainPath(target, this.findPath(target.targetLocation))
    }

    findPath(targetLocation: Vector2): Vector2[] {
        return this.worldMgr.sceneMgr.terrain.pathFinder.findPath(this.sceneEntity.position2D, targetLocation, this.stats, true)
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
            const path = this.findPathToTarget(target)
            this.currentPath = path.locations.length > 0 ? path : null
            if (!this.currentPath) return MoveState.TARGET_UNREACHABLE
        }
        const step = this.determineStep(elapsedMs)
        if (step.targetReached) {
            this.sceneEntity.headTowards(this.currentPath.target.getFocusPoint())
            return MoveState.TARGET_REACHED
        } else {
            this.sceneEntity.headTowards(this.currentPath.firstLocation)
            this.sceneEntity.position.add(step.vec)
            this.sceneEntity.setAnimation(this.getRouteActivity())
            EventBus.publishEvent(new UpdateRadarEntities(this.worldMgr.entityMgr)) // TODO only send map updates not all
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
        if (this.currentPath.target.targetLocation.distanceToSquared(this.sceneEntity.position2D) <= entitySpeedSq + this.currentPath.target.radiusSq) {
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
        this.dropCarried()
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

    getDefaultAnimationName(): AnimationActivity {
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
        if (this.job) this.job.assign(this)
        this.followUpJob = followUpJob
        if (this.followUpJob) this.followUpJob.assign(this)
    }

    getDrillTimeSeconds(surface: Surface): number {
        if (!surface || !this.hasTool(RaiderTool.DRILL)) return 0
        return (this.stats[surface.surfaceType.statsDrillName]?.[this.level] || 0)
    }

    stopJob() {
        this.dropCarried()
        this.workAudio = resetAudioSafe(this.workAudio)
        if (!this.job) return
        this.job.unAssign(this)
        if (this.followUpJob) this.followUpJob.unAssign(this)
        this.job = null
        this.followUpJob = null
        this.sceneEntity.setAnimation(this.getDefaultAnimationName())
    }

    dropCarried(): void {
        if (!this.carries) return
        this.sceneEntity.dropAllEntities()
        this.carries = null
    }

    private work(elapsedMs: number) {
        if (this.slipped) return
        if (this.vehicle) {
            this.sceneEntity.setAnimation(this.vehicle.getDriverActivity())
            return
        }
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
        this.sceneEntity.setAnimation(workActivity, () => {
            this.completeJob()
        }, this.job.getExpectedTimeLeft())
        this.job?.addProgress(this, elapsedMs)
    }

    private completeJob() {
        if (this.workAudio?.loop) this.workAudio = resetAudioSafe(this.workAudio)
        else this.workAudio = null
        this.job?.onJobComplete()
        this.sceneEntity.setAnimation(this.getDefaultAnimationName())
        if (this.job?.jobState === JobState.INCOMPLETE) return
        if (this.job) this.job.unAssign(this)
        this.job = this.followUpJob
        this.followUpJob = null
    }

    private grabJobItem(elapsedMs: number, carryItem: MaterialEntity): boolean {
        if (this.carries === carryItem) return true
        this.dropCarried()
        if (!carryItem) return true
        const positionAsPathTarget = PathTarget.fromLocation(carryItem.sceneEntity.position2D, ITEM_ACTION_RANGE_SQ)
        if (this.moveToClosestTarget(positionAsPathTarget, elapsedMs) === MoveState.TARGET_REACHED) {
            this.sceneEntity.setAnimation(RaiderActivity.Collect, () => {
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
