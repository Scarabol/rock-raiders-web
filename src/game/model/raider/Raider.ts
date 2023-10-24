import { PositionalAudio, Vector2, Vector3 } from 'three'
import { resetAudioSafe } from '../../../audio/AudioUtil'
import { Sample } from '../../../audio/Sample'
import { EventBus } from '../../../event/EventBus'
import { RaidersAmountChangedEvent, UpdateRadarEntities } from '../../../event/LocalEvents'
import { ITEM_ACTION_RANGE_SQ, NATIVE_UPDATE_INTERVAL, RAIDER_CARRY_SLOWDOWN, SPIDER_SLIP_RANGE_SQ, TILESIZE } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { WorldManager } from '../../WorldManager'
import { AnimationActivity, AnimEntityActivity, RaiderActivity, RockMonsterActivity } from '../anim/AnimationActivity'
import { EntityStep } from '../EntityStep'
import { GameState } from '../GameState'
import { Job, JobFulfiller } from '../job/Job'
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
import { PositionComponent } from '../../component/PositionComponent'
import { BeamUpComponent } from '../../component/BeamUpComponent'
import { AnimatedSceneEntityComponent } from '../../component/AnimatedSceneEntityComponent'
import { SelectionFrameComponent } from '../../component/SelectionFrameComponent'
import { AnimatedSceneEntity } from '../../../scene/AnimatedSceneEntity'
import { OxygenComponent } from '../../component/OxygenComponent'
import { GenericDeathEvent, WorldLocationEvent } from '../../../event/WorldLocationEvent'
import { RaiderInfoComponent } from '../../component/RaiderInfoComponent'
import { RockMonsterBehaviorComponent } from '../../component/RockMonsterBehaviorComponent'
import { LastWillComponent } from '../../component/LastWillComponent'
import { MonsterStatsComponent } from '../../component/MonsterStatsComponent'
import { RaiderScareComponent, RaiderScareRange } from '../../component/RaiderScareComponent'
import { EventKey } from '../../../event/EventKeyEnum'
import { ScannerComponent } from '../../component/ScannerComponent'

export class Raider implements Updatable, JobFulfiller {
    readonly entityType: EntityType = EntityType.PILOT
    readonly entity: GameEntity
    readonly infoComponent: RaiderInfoComponent
    readonly tools: RaiderTool[] = []
    readonly trainings: RaiderTraining[] = []
    worldMgr: WorldManager
    currentPath: TerrainPath = null
    level: number = 0
    job: Job = null
    followUpJob: Job = null
    workAudio: PositionalAudio
    sceneEntity: AnimatedSceneEntity
    carries: MaterialEntity = null
    slipped: boolean = false
    thrown: boolean = false
    foodLevel: number = 1
    vehicle: VehicleEntity = null
    scared: boolean = false
    toolsIndex: number = 0
    weaponCooldown: number = 0

    constructor(worldMgr: WorldManager) {
        this.worldMgr = worldMgr
        this.addTool(RaiderTool.DRILL)
        this.entity = this.worldMgr.ecs.addEntity()
        this.sceneEntity = new AnimatedSceneEntity(this.worldMgr.sceneMgr.audioListener)
        this.sceneEntity.addAnimated(ResourceManager.getAnimatedData('mini-figures/pilot'))
        this.worldMgr.ecs.addComponent(this.entity, new AnimatedSceneEntityComponent(this.sceneEntity))
        const healthComponent = this.worldMgr.ecs.addComponent(this.entity, new HealthComponent(false, 16, 10, this.sceneEntity, true, ResourceManager.getRockFallDamage(this.entityType, this.level)))
        this.worldMgr.sceneMgr.addSprite(healthComponent.sprite)
        this.worldMgr.ecs.addComponent(this.entity, new OxygenComponent(this.stats.OxygenCoef))
        this.infoComponent = this.worldMgr.ecs.addComponent(this.entity, new RaiderInfoComponent(this.sceneEntity))
        this.worldMgr.ecs.addComponent(this.entity, new LastWillComponent(() => this.beamUp()))
        this.worldMgr.entityMgr.addEntity(this.entity, this.entityType)
    }

    get stats() {
        return ResourceManager.configuration.stats.pilot
    }

    update(elapsedMs: number) {
        if (this.weaponCooldown > 0) this.weaponCooldown -= elapsedMs
        if (this.slipped) return
        if (this.vehicle) {
            this.sceneEntity.setAnimation(this.vehicle.getDriverActivity())
            return
        }
        if (this.isInBeam() || this.thrown || this.selected) return
        if (GameState.alarmMode && this.hasWeapon()) {
            this.fight(elapsedMs)
            return
        }
        if (!this.job) {
            this.scared = false
            this.infoComponent.setBubbleTexture('bubbleIdle')
            this.sceneEntity.setAnimation(AnimEntityActivity.Stand)
            return
        }
        this.work(elapsedMs)
    }

    isDriving(): boolean {
        return !!this.vehicle
    }

    beamUp() {
        this.stopJob()
        const components = this.worldMgr.ecs.getComponents(this.entity)
        EventBus.publishEvent(new GenericDeathEvent(components.get(PositionComponent)))
        components.get(SelectionFrameComponent)?.deselect()
        this.worldMgr.ecs.removeComponent(this.entity, SelectionFrameComponent)
        this.worldMgr.ecs.addComponent(this.entity, new BeamUpComponent(this))
        EventBus.publishEvent(new RaidersAmountChangedEvent(this.worldMgr.entityMgr))
    }

    disposeFromWorld() {
        this.disposeFromScene()
        this.workAudio = resetAudioSafe(this.workAudio)
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
        return this.worldMgr.sceneMgr.terrain.pathFinder.findShortestPath(this.getPosition2D(), targets, this.stats, true)
    }

    private moveToClosestTarget(target: PathTarget, elapsedMs: number): MoveState {
        const result = this.moveToClosestTargetInternal(target, elapsedMs)
        if (result === MoveState.MOVED) {
            const raiderPosition2D = this.getPosition2D()
            this.worldMgr.entityMgr.spiders.some((spider) => {
                const components = this.worldMgr.ecs.getComponents(spider)
                const spiderPosition2D = components.get(PositionComponent).getPosition2D()
                if (raiderPosition2D.distanceToSquared(spiderPosition2D) < SPIDER_SLIP_RANGE_SQ) {
                    this.slip()
                    this.worldMgr.entityMgr.removeEntity(spider)
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
            this.worldMgr.entityMgr.rockMonsters.forEach((rocky) => {
                const components = this.worldMgr.ecs.getComponents(rocky)
                const rockySceneEntity = components.get(AnimatedSceneEntityComponent).sceneEntity
                if (rockySceneEntity.currentAnimation === RockMonsterActivity.Unpowered) {
                    const positionComponent = components.get(PositionComponent)
                    const rockyPosition2D = positionComponent.getPosition2D()
                    const wakeRadius = components.get(MonsterStatsComponent).stats.WakeRadius
                    if (raiderPosition2D.distanceToSquared(rockyPosition2D) < wakeRadius * wakeRadius) {
                        rockySceneEntity.setAnimation(RockMonsterActivity.WakeUp, () => {
                            this.worldMgr.ecs.addComponent(rocky, new RaiderScareComponent(RaiderScareRange.ROCKY))
                            this.worldMgr.ecs.addComponent(rocky, new RockMonsterBehaviorComponent())
                            EventBus.publishEvent(new WorldLocationEvent(EventKey.LOCATION_MONSTER, positionComponent))
                        })
                    }
                }
            })
        } else if (result === MoveState.TARGET_UNREACHABLE) {
            console.warn('Raider could not move to job target, stopping job', this.job, target)
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
            return MoveState.TARGET_REACHED
        } else {
            this.sceneEntity.headTowards(this.currentPath.firstLocation)
            this.setPosition(this.getPosition().add(step.vec))
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
        return this.stats.RouteSpeed[this.level] * (this.isOnPath() ? this.stats.PathCoef : 1) * (this.isOnRubble() ? this.stats.RubbleCoef : 1) * (!!this.carries ? RAIDER_CARRY_SLOWDOWN : 1)
    }

    private getRouteActivity(): AnimationActivity {
        if (this.scared) {
            return RaiderActivity.RunPanic
        } else if (this.isOnRubble()) {
            return !!this.carries ? RaiderActivity.CarryRubble : RaiderActivity.routeRubble
        } else {
            return !!this.carries ? AnimEntityActivity.Carry : AnimEntityActivity.Route
        }
    }

    private isOnPath(): boolean {
        return this.getSurface().isPath()
    }

    private isOnRubble() {
        return this.getSurface().hasRubble()
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
        this.workAudio = resetAudioSafe(this.workAudio)
        return true
    }

    private getDefaultAnimationName(): AnimationActivity {
        return this.carries ? AnimEntityActivity.StandCarry : AnimEntityActivity.Stand
    }

    deselect() {
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.deselect()
    }

    isSelectable(): boolean {
        return !this.selected && !this.isInBeam() && !this.slipped && !this.vehicle && !this.scared && !this.thrown
    }

    private isInBeam(): boolean {
        return !this.worldMgr.ecs.getComponents(this.entity).has(SelectionFrameComponent)
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
        const floorPosition = this.carries.worldMgr.sceneMgr.getFloorPosition(this.carries.getPosition2D())
        this.carries.setPosition(floorPosition)
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
        if (!this.workAudio && this.job.workSoundRaider) {
            this.workAudio = this.worldMgr.sceneMgr.addPositionalAudio(this.sceneEntity, Sample[this.job.workSoundRaider], true, this.job.getExpectedTimeLeft() !== null)
        }
        if (workActivity === RaiderActivity.Drill) {
            this.sceneEntity.headTowards(this.job.surface.getCenterWorld2D())
            this.sceneEntity.setAnimation(workActivity)
            this.job?.addProgress(this, elapsedMs)
        } else if (workActivity === AnimEntityActivity.Stand) {
            this.sceneEntity.setAnimation(workActivity)
            this.completeJob()
        } else {
            const focusPoint = this.job?.getWorkplace(this)?.focusPoint
            if (focusPoint) this.sceneEntity.headTowards(focusPoint)
            this.sceneEntity.setAnimation(workActivity, () => {
                this.completeJob()
            }, this.job.getExpectedTimeLeft())
        }
    }

    private fight(elapsedMs: number) {
        this.stopJob()
        this.infoComponent.setBubbleTexture('bubbleCallToArms')
        this.scared = false
        const targets = this.worldMgr.entityMgr.getRaiderFightTargets()
        const alarmTarget = this.findShortestPath(targets) // TODO Find closest position where shooting is possible, don't shoot through walls
        if (!alarmTarget) {
            this.sceneEntity.setAnimation(AnimEntityActivity.Stand)
            return
        }
        const moveState = this.moveToClosestTargetInternal(alarmTarget.target, elapsedMs)
        if (moveState !== MoveState.TARGET_REACHED) {
            if (moveState === MoveState.TARGET_UNREACHABLE) {
                this.sceneEntity.setAnimation(AnimEntityActivity.Stand)
            }
            return
        }
        const targetComponents = this.worldMgr.ecs.getComponents(alarmTarget.target.entity)
        const stats = targetComponents.get(MonsterStatsComponent).stats
        const attacks = [
            {
                tool: RaiderTool.LASER,
                allowed: stats.CanLaser,
                damage: stats.LaserDamage,
                weaponStats: ResourceManager.configuration.weaponTypes.get('lasershot'),
                bulletType: EntityType.LASER_SHOT,
                misc: ResourceManager.configuration.miscObjects.LaserShot
            },
            {
                tool: RaiderTool.FREEZERGUN,
                allowed: stats.CanFreeze,
                damage: stats.FreezerDamage,
                weaponStats: ResourceManager.configuration.weaponTypes.get('freezer'),
                bulletType: EntityType.FREEZER_SHOT,
                misc: ResourceManager.configuration.miscObjects.Freezer
            },
            {
                tool: RaiderTool.PUSHERGUN,
                allowed: stats.CanPush,
                damage: stats.PusherDamage,
                weaponStats: ResourceManager.configuration.weaponTypes.get('pusher'),
                bulletType: EntityType.PUSHER_SHOT,
                misc: ResourceManager.configuration.miscObjects.Pusher
            },
        ].filter((a) => a.allowed && this.hasTool(a.tool)).sort((l, r) => r.damage - l.damage)
        if (attacks.length < 1) {
            console.warn('Could not shoot at monster')
            return
        }
        const attack = attacks[0]
        if (this.weaponCooldown <= 0) {
            // TODO Visualize shot as bullet and add to bullet system
            // const bullet = new AbstractGameEntity(atk.bulletType)
            // bullet.addComponent(new LifecycleComponent())
            // bullet.addComponent(new PositionComponent()).setPosition2D(this.sceneEntity.position2D)
            // bullet.addComponent(new BulletMovementGameComponent(this.currentPath.target.targetLocation))
            // const start = this.sceneEntity.position.clone()
            // start.y += TILESIZE / 4
            // bullet.addComponent(new MiscAnimComponent(atk.misc, start, this.currentPath.target.targetLocation))
            // this.worldMgr.registerEntity(bullet)
            this.sceneEntity.setAnimation(RaiderActivity.Shoot, () => {
                this.sceneEntity.setAnimation(AnimEntityActivity.Stand)
                this.weaponCooldown = attack.weaponStats.rechargeTimeMs
                const healthComponent = targetComponents.get(HealthComponent)
                healthComponent.changeHealth(-attack.damage) // TODO Replace with damage by bullet system
                // TODO Apply push effect
                // TODO Apply freeze effect
            })
        }
    }

    private completeJob() {
        if (this.workAudio?.loop) this.workAudio = resetAudioSafe(this.workAudio)
        else this.workAudio = null
        this.job?.onJobComplete(this)
        this.sceneEntity.setAnimation(this.getDefaultAnimationName())
        if (this.job?.jobState === JobState.INCOMPLETE) return
        if (this.job) this.job.unAssign(this)
        this.job = this.followUpJob
        this.infoComponent.setBubbleTexture(this.job?.getJobBubble() || 'bubbleIdle')
        this.followUpJob = null
    }

    private grabJobItem(elapsedMs: number, carryItem: MaterialEntity): boolean {
        if (this.carries === carryItem) return true
        this.dropCarried(true)
        if (!carryItem) return true
        const positionAsPathTarget = PathTarget.fromLocation(carryItem.getPosition2D(), ITEM_ACTION_RANGE_SQ)
        if (this.moveToClosestTarget(positionAsPathTarget, elapsedMs) === MoveState.TARGET_REACHED) {
            this.sceneEntity.setAnimation(RaiderActivity.Collect, () => {
                this.carries = carryItem
                this.sceneEntity.pickupEntity(carryItem.sceneEntity)
            })
        }
        return false
    }

    hasTool(tool: RaiderTool) {
        return !tool || this.tools.some((t) => t === tool)
    }

    private hasWeapon(): boolean {
        return [RaiderTool.FREEZERGUN, RaiderTool.LASER, RaiderTool.PUSHERGUN].some((w) => this.hasTool(w))
    }

    hasTraining(training: RaiderTraining) {
        return !training || this.trainings.some((t) => t === training)
    }

    addTool(tool: RaiderTool) {
        if (this.hasTool(tool)) return
        if (this.tools.length < this.maxTools()) {
            this.tools.add(tool)
            this.toolsIndex = this.tools.length % this.maxTools()
        } else {
            this.tools[this.toolsIndex] = tool
            this.toolsIndex = (this.toolsIndex + 1) % this.maxTools()
        }
    }

    removeTool(tool: RaiderTool) {
        this.tools.remove(tool)
    }

    addTraining(training: RaiderTraining) {
        this.trainings.add(training)
        if (training === RaiderTraining.GEOLOGIST) {
            const scannerRange = this.stats.SurveyRadius?.[this.level] ?? 0
            if (scannerRange) {
                const positionComponent = this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent)
                this.worldMgr.ecs.addComponent(this.entity, new ScannerComponent(positionComponent, scannerRange))
            }
        }
    }

    isPrepared(job: Job): boolean {
        if (job.requiredTool === RaiderTool.DRILL) return this.canDrill(job.surface)
        return this.hasTool(job.requiredTool) && this.hasTraining(job.requiredTraining) && this.hasCapacity()
    }

    canDrill(surface: Surface): boolean {
        return this.getDrillTimeSeconds(surface) > 0
    }

    hasCapacity(): boolean {
        return !this.carries
    }

    getCarryCapacity(): number {
        return 1
    }

    isReadyToTakeAJob(): boolean {
        return !this.job && !this.selected && this.canBeScared()
    }

    canBeScared() {
        return !this.isInBeam() && !this.slipped && !this.scared && (!GameState.alarmMode || !this.hasWeapon()) && !this.thrown
    }

    maxTools(): number {
        return this.stats.NumOfToolsCanCarry[this.level] ?? 2
    }

    getRepairValue(): number {
        return this.stats.RepairValue[this.level] || 0
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
