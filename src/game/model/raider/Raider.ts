import { Vector2, Vector3 } from 'three'
import { SoundManager } from '../../../audio/SoundManager'
import { RaidersAmountChangedEvent, UpdateRadarEntityEvent } from '../../../event/LocalEvents'
import { ITEM_ACTION_RANGE_SQ, NATIVE_UPDATE_INTERVAL, RAIDER_CARRY_SLOWDOWN, RAIDER_PATH_PRECISION, SPIDER_SLIP_RANGE_SQ, TILESIZE } from '../../../params'
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
import { PositionComponent } from '../../component/PositionComponent'
import { BeamUpComponent } from '../../component/BeamUpComponent'
import { AnimatedSceneEntityComponent } from '../../component/AnimatedSceneEntityComponent'
import { SelectionFrameComponent } from '../../component/SelectionFrameComponent'
import { AnimatedSceneEntity } from '../../../scene/AnimatedSceneEntity'
import { WorldLocationEvent } from '../../../event/WorldEvents'
import { RaiderInfoComponent } from '../../component/RaiderInfoComponent'
import { RockMonsterBehaviorComponent } from '../../component/RockMonsterBehaviorComponent'
import { LastWillComponent } from '../../component/LastWillComponent'
import { MonsterStatsComponent } from '../../component/MonsterStatsComponent'
import { RaiderScareComponent, RaiderScareRange } from '../../component/RaiderScareComponent'
import { EventKey } from '../../../event/EventKeyEnum'
import { ScannerComponent } from '../../component/ScannerComponent'
import { MapMarkerChange, MapMarkerComponent, MapMarkerType } from '../../component/MapMarkerComponent'
import { BulletComponent } from '../../component/BulletComponent'
import { GameConfig } from '../../../cfg/GameConfig'
import { EventBroker } from '../../../event/EventBroker'
import { TooltipComponent } from '../../component/TooltipComponent'
import { TooltipSpriteBuilder } from '../../../resource/TooltipSpriteBuilder'
import { SelectionNameComponent } from '../../component/SelectionNameComponent'
import { PRNG } from '../../factory/PRNG'
import { SaveGameRaider } from '../../../resource/SaveGameManager'

export class Raider implements Updatable, JobFulfiller {
    readonly entityType: EntityType = EntityType.PILOT
    readonly entity: GameEntity
    readonly tools: RaiderTool[] = []
    readonly trainings: RaiderTraining[] = []
    readonly teamMember: SaveGameRaider
    worldMgr: WorldManager
    currentPath?: TerrainPath
    level: number = 0
    job?: Job
    followUpJob?: Job
    workAudioId?: number
    sceneEntity: AnimatedSceneEntity
    carries?: MaterialEntity
    slipped: boolean = false
    thrown: boolean = false
    foodLevel: number = 1
    vehicle?: VehicleEntity
    scared: boolean = false
    toolsIndex: number = 0
    weaponCooldown: number = 0
    resting: boolean = false
    idleCounter: number = PRNG.animation.randInt(3000)
    taskingWhileSelected: boolean = false

    constructor(worldMgr: WorldManager) {
        this.worldMgr = worldMgr
        this.addTool(RaiderTool.DRILL)
        this.entity = this.worldMgr.ecs.addEntity()
        this.sceneEntity = new AnimatedSceneEntity()
        this.sceneEntity.addAnimated(ResourceManager.getAnimatedData('mini-figures/pilot'))
        this.worldMgr.ecs.addComponent(this.entity, new AnimatedSceneEntityComponent(this.sceneEntity))
        this.worldMgr.ecs.addComponent(this.entity, new LastWillComponent(() => this.beamUp()))
        const objectKey = this.entityType.toLowerCase()
        this.teamMember = this.worldMgr.entityMgr.addRaiderToTeam(this)
        const raiderName = this.teamMember.name || GameConfig.instance.objectNames[objectKey] || 'Rock Raider'
        const sfxKey = GameConfig.instance.objTtSFXs[objectKey] || ''
        this.worldMgr.ecs.addComponent(this.entity, new TooltipComponent(this.entity, raiderName, sfxKey, () => {
            return TooltipSpriteBuilder.getRaiderTooltipSprite(raiderName, this.maxTools(), this.tools, this.trainings)
        }))
        this.worldMgr.ecs.addComponent(this.entity, new SelectionNameComponent(this.sceneEntity)).setName(this.teamMember.name)
        this.worldMgr.entityMgr.addEntity(this.entity, this.entityType)
    }

    get stats() {
        return GameConfig.instance.stats.pilot
    }

    update(elapsedMs: number) {
        if (this.weaponCooldown > 0) this.weaponCooldown -= elapsedMs
        if (this.vehicle) {
            this.sceneEntity.setAnimation(this.vehicle.getDriverActivity())
            return
        }
        if (this.slipped || this.isInBeam() || this.thrown || (this.selected && !this.taskingWhileSelected) || this.resting) return
        if (GameState.alarmMode && this.hasWeapon() && !this.job?.doOnAlarm) {
            this.fight(elapsedMs)
            return
        }
        if (!this.job) {
            this.scared = false
            this.worldMgr.ecs.getComponents(this.entity).get(RaiderInfoComponent).setBubbleTexture('bubbleIdle')
            if (this.idleCounter > 3000) {
                const idleAnim = PRNG.animation.sample(['Activity_Waiting1', 'Activity_Waiting2', 'Activity_Waiting3', 'Activity_Waiting4'])
                this.idleCounter = 0
                this.sceneEntity.setAnimation(idleAnim, () => {
                    this.sceneEntity.setAnimation(AnimEntityActivity.Stand)
                })
            } else {
                this.idleCounter += PRNG.animation.randInt(elapsedMs)
            }
            return
        }
        this.idleCounter = 0
        this.work(elapsedMs)
    }

    isDriving(): boolean {
        return !!this.vehicle
    }

    beamUp() {
        this.stopJob()
        const components = this.worldMgr.ecs.getComponents(this.entity)
        EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_DEATH, components.get(PositionComponent)))
        components.get(SelectionFrameComponent)?.deselect()
        components.get(SelectionNameComponent)?.setVisible(false)
        this.worldMgr.ecs.removeComponent(this.entity, SelectionFrameComponent)
        this.worldMgr.ecs.removeComponent(this.entity, MapMarkerComponent)
        EventBroker.publish(new UpdateRadarEntityEvent(MapMarkerType.DEFAULT, this.entity, MapMarkerChange.REMOVE))
        this.worldMgr.ecs.removeComponent(this.entity, ScannerComponent)
        EventBroker.publish(new UpdateRadarEntityEvent(MapMarkerType.SCANNER, this.entity, MapMarkerChange.REMOVE))
        this.worldMgr.ecs.addComponent(this.entity, new BeamUpComponent(this))
        EventBroker.publish(new RaidersAmountChangedEvent(this.worldMgr.entityMgr))
    }

    disposeFromWorld() {
        this.worldMgr.sceneMgr.disposeSceneEntity(this.sceneEntity)
        this.workAudioId = SoundManager.stopAudio(this.workAudioId)
        this.worldMgr.entityMgr.removeEntity(this.entity)
        this.worldMgr.ecs.removeEntity(this.entity)
    }

    /*
    Movement
     */

    findShortestPath(targets: PathTarget[] | PathTarget | undefined): TerrainPath | undefined {
        return this.worldMgr.sceneMgr.terrain.pathFinder.findShortestPath(this.getPosition2D(), targets, this.stats, RAIDER_PATH_PRECISION)
    }

    private moveToClosestTarget(target: PathTarget | undefined, elapsedMs: number): MoveState {
        const result = this.moveToClosestTargetInternal(target, elapsedMs)
        if (result === MoveState.MOVED) {
            this.onEntityMoved()
        } else if (result === MoveState.TARGET_UNREACHABLE) {
            console.warn('Raider could not move to job target, stopping job', this.job, target)
            this.stopJob()
        }
        return result
    }

    onEntityMoved() {
        const raiderPosition2D = this.getPosition2D()
        this.worldMgr.entityMgr.spiders.some((spider) => {
            const components = this.worldMgr.ecs.getComponents(spider)
            const spiderPosition2D = components.get(PositionComponent).getPosition2D()
            if (raiderPosition2D.distanceToSquared(spiderPosition2D) < SPIDER_SLIP_RANGE_SQ) {
                this.slip()
                this.worldMgr.entityMgr.removeEntity(spider)
                this.worldMgr.ecs.removeEntity(spider)
                const sceneEntityComponent = components.get(AnimatedSceneEntityComponent)
                if (sceneEntityComponent) this.worldMgr.sceneMgr.disposeSceneEntity(sceneEntityComponent.sceneEntity)
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
                const wakeRadius = components.get(MonsterStatsComponent).stats.wakeRadius
                if (raiderPosition2D.distanceToSquared(rockyPosition2D) < Math.pow(wakeRadius + this.stats.collRadius, 2)) {
                    rockySceneEntity.setAnimation(RockMonsterActivity.WakeUp, () => {
                        this.worldMgr.ecs.addComponent(rocky, new RaiderScareComponent(RaiderScareRange.ROCKY))
                        this.worldMgr.ecs.addComponent(rocky, new RockMonsterBehaviorComponent())
                        EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_MONSTER, positionComponent))
                    })
                }
            }
        })
    }

    private moveToClosestTargetInternal(target: PathTarget | undefined, elapsedMs: number): MoveState {
        if (!target) return MoveState.TARGET_UNREACHABLE
        if (!this.currentPath || !target.targetLocation.equals(this.currentPath.target.targetLocation)) {
            const path = this.findShortestPath(target)
            this.currentPath = path && path.locations.length > 0 ? path : undefined
            if (!this.currentPath) return MoveState.TARGET_UNREACHABLE
            const currentPath = this.currentPath
            currentPath.locations.forEach((l, index) => {
                if (index < currentPath.locations.length - 1) l.add(new Vector2().random().subScalar(0.5).multiplyScalar(TILESIZE / RAIDER_PATH_PRECISION))
            }) // XXX Externalize precision
        }
        const step = this.determineStep(elapsedMs, this.currentPath)
        if (step.targetReached) {
            return MoveState.TARGET_REACHED
        } else {
            this.sceneEntity.headTowards(this.currentPath.firstLocation)
            this.setPosition(this.getPosition().add(step.vec))
            this.sceneEntity.setAnimation(this.getRouteActivity())
            if (this.foodLevel > 0) this.foodLevel -= step.vec.lengthSq() / TILESIZE / TILESIZE / 5
            if (!!this.carries) {
                // XXX Adjust balancing for resting
                const chanceToRestPerSecond = this.stats.restPercent / 20 * Math.max(0, 1 - this.foodLevel / this.stats.restPercent)
                if (PRNG.movement.random() < chanceToRestPerSecond * elapsedMs / 1000) {
                    this.resting = true
                    this.sceneEntity.setAnimation('Activity_Rest', () => {
                        this.resting = false
                    })
                }
            }
            this.worldMgr.ecs.getComponents(this.entity).get(RaiderInfoComponent).setHungerIndicator(this.foodLevel)
            return MoveState.MOVED
        }
    }

    private determineStep(elapsedMs: number, currentPath: TerrainPath): EntityStep {
        const targetWorld = this.worldMgr.sceneMgr.getFloorPosition(currentPath.firstLocation)
        targetWorld.y += this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent)?.floorOffset ?? 0
        const step = new EntityStep(targetWorld.sub(this.getPosition()))
        const stepLengthSq = step.vec.lengthSq()
        const entitySpeed = this.getSpeed() * elapsedMs / NATIVE_UPDATE_INTERVAL // XXX use average speed between current and target position
        const entitySpeedSq = entitySpeed * entitySpeed
        if (currentPath.locations.length > 1) {
            if (stepLengthSq <= entitySpeedSq) {
                currentPath.locations.shift()
                return this.determineStep(elapsedMs, currentPath)
            }
        }
        if (currentPath.target.targetLocation.distanceToSquared(this.getPosition2D()) <= currentPath.target.radiusSq) {
            step.targetReached = true
        }
        step.vec.clampLength(0, entitySpeed)
        return step
    }

    getSpeed(): number {
        const currentSurface = this.getSurface()
        const pathMultiplier = currentSurface.isPath() ? this.stats.pathCoef : 1
        const rubbleMultiplier = currentSurface.hasRubble() ? this.stats.rubbleCoef : 1
        const carriesMultiplier = !!this.carries ? RAIDER_CARRY_SLOWDOWN : 1
        return this.stats.routeSpeed[this.level] * pathMultiplier * rubbleMultiplier * carriesMultiplier
    }

    getRouteActivity(): AnimationActivity {
        if (this.scared) {
            return RaiderActivity.RunPanic
        } else if (this.getSurface().hasRubble()) {
            return !!this.carries ? RaiderActivity.CarryRubble : RaiderActivity.routeRubble
        } else {
            return !!this.carries ? AnimEntityActivity.Carry : AnimEntityActivity.Route
        }
    }

    private slip() {
        this.dropCarried(true)
        if (PRNG.movement.randInt(100) < 10) this.stopJob()
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

    select(primary: boolean): boolean {
        if (!this.isSelectable()) return false
        const components = this.worldMgr.ecs.getComponents(this.entity)
        const selectionFrameComponent = components.get(SelectionFrameComponent)
        primary ? selectionFrameComponent?.select() : selectionFrameComponent?.selectSecondary()
        components.get(SelectionNameComponent)?.setVisible(true)
        this.sceneEntity.setAnimation(this.getDefaultAnimationName())
        this.workAudioId = SoundManager.stopAudio(this.workAudioId)
        this.taskingWhileSelected = false
        return true
    }

    getDefaultAnimationName(): AnimationActivity {
        return this.carries ? AnimEntityActivity.StandCarry : AnimEntityActivity.Stand
    }

    deselect() {
        const components = this.worldMgr.ecs.getComponents(this.entity)
        this.taskingWhileSelected = false
        components.get(SelectionFrameComponent)?.deselect()
        components.get(SelectionNameComponent)?.setVisible(false)
    }

    isSelectable(): boolean {
        return !this.selected && !this.isInBeam() && !this.slipped && !this.vehicle && !this.scared && !this.thrown && !this.resting
    }

    private isInBeam(): boolean {
        return !this.worldMgr.ecs.getComponents(this.entity).has(SelectionFrameComponent)
    }

    /*
    Working on Jobs
     */

    setJob(job: Job, followUpJob?: Job) {
        if (this.job !== job) this.stopJob()
        this.job = job
        this.worldMgr.ecs.getComponents(this.entity).get(RaiderInfoComponent).setBubbleTexture(this.job.getJobBubble())
        if (this.job) this.job.assign(this)
        this.followUpJob = followUpJob
        if (this.followUpJob) this.followUpJob.assign(this)
    }

    getDrillTimeSeconds(surface: Surface): number {
        if (!surface || !this.hasTool(RaiderTool.DRILL)) return 0
        const statsDrillName = surface.surfaceType.statsDrillName
        if (!statsDrillName) return 0
        return this.stats[statsDrillName]?.[this.level] || 0
    }

    stopJob() {
        this.dropCarried(false)
        this.workAudioId = SoundManager.stopAudio(this.workAudioId)
        if (!this.job) return
        this.job.unAssign(this)
        if (this.followUpJob) this.followUpJob.unAssign(this)
        this.job = undefined
        this.followUpJob = undefined
        this.sceneEntity.setAnimation(this.getDefaultAnimationName())
        this.worldMgr.ecs.getComponents(this.entity).get(RaiderInfoComponent).setBubbleTexture('bubbleIdle')
    }

    dropCarried(unAssignFromSite: boolean): MaterialEntity[] {
        if (!this.carries) return []
        if (unAssignFromSite) this.carries.carryJob?.target?.site?.unAssign(this.carries)
        this.sceneEntity.removeAllCarried()
        const floorPosition = this.carries.worldMgr.sceneMgr.getFloorPosition(this.carries.getPosition2D())
        this.carries.setPosition(floorPosition)
        this.carries.worldMgr.sceneMgr.addSceneEntity(this.carries.sceneEntity)
        const carriedEntity = this.carries
        this.carries = undefined
        return [carriedEntity]
    }

    private work(elapsedMs: number) {
        if (this.job?.jobState !== JobState.INCOMPLETE) {
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
        if (!this.workAudioId && this.job.workSoundRaider) {
            this.workAudioId = this.worldMgr.sceneMgr.addPositionalAudio(this.sceneEntity, this.job.workSoundRaider, this.job.getExpectedTimeLeft() !== null)
        }
        if (workActivity === RaiderActivity.Drill) {
            const workplace = this.job.getWorkplace(this)
            if (!this.job.surface || !workplace) {
                this.stopJob()
                return
            }
            this.sceneEntity.headTowards(this.job.surface.getCenterWorld2D())
            this.sceneEntity.setAnimation(workActivity)
            this.job.surface.addDrillTimeProgress(this.getDrillTimeSeconds(this.job.surface), elapsedMs, workplace.targetLocation)
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
        this.worldMgr.ecs.getComponents(this.entity).get(RaiderInfoComponent).setBubbleTexture('bubbleCallToArms')
        this.scared = false
        const targets = this.worldMgr.entityMgr.getRaiderFightTargets()
        const alarmTarget = this.findShortestPath(targets) // TODO Find closest position where shooting is possible, don't shoot through walls
        if (!alarmTarget?.target.entity) {
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
                damage: stats.laserDamage,
                weaponStats: GameConfig.instance.weaponTypes.laserShot,
                bulletType: EntityType.LASER_SHOT,
                misc: GameConfig.instance.miscObjects.laserShot
            },
            {
                tool: RaiderTool.FREEZER_GUN,
                damage: stats.freezerDamage,
                weaponStats: GameConfig.instance.weaponTypes.freezer,
                bulletType: EntityType.FREEZER_SHOT,
                misc: GameConfig.instance.miscObjects.freezer
            },
            {
                tool: RaiderTool.PUSHER_GUN,
                damage: stats.pusherDamage,
                weaponStats: GameConfig.instance.weaponTypes.pusher,
                bulletType: EntityType.PUSHER_SHOT,
                misc: GameConfig.instance.miscObjects.pusher
            },
        ].filter((a) => this.hasTool(a.tool)).sort((l, r) => r.damage - l.damage)
        if (attacks.length < 1) {
            console.warn('Could not shoot at monster')
            this.sceneEntity.setAnimation(AnimEntityActivity.Stand)
            return
        }
        const attack = attacks[0]
        if (this.weaponCooldown <= 0) {
            const gunPos = this.getPosition()
            gunPos.y += 10
            const targetPos = targetComponents.get(PositionComponent)
            const targetLocation = targetPos.getPosition2D()
            const bulletAnim = this.worldMgr.sceneMgr.addMiscAnim(attack.misc, gunPos, 0, true)
            bulletAnim.lookAt(targetPos.position)
            const bulletEntity = this.worldMgr.ecs.addEntity()
            this.worldMgr.ecs.addComponent(bulletEntity, new BulletComponent(bulletAnim, targetLocation, attack.bulletType))
            this.worldMgr.entityMgr.addEntity(bulletEntity, attack.bulletType)
            this.weaponCooldown = attack.weaponStats.rechargeTimeMs
            this.sceneEntity.headTowards(targetLocation)
            this.sceneEntity.setAnimation(RaiderActivity.Shoot, () => {
                this.sceneEntity.setAnimation(AnimEntityActivity.Stand)
            })
        }
    }

    private completeJob() {
        this.workAudioId = SoundManager.stopAudio(this.workAudioId)
        this.job?.onJobComplete(this)
        this.sceneEntity.setAnimation(this.getDefaultAnimationName())
        if (this.job?.jobState === JobState.INCOMPLETE) return
        if (this.job) this.job.unAssign(this)
        this.job = this.followUpJob
        this.followUpJob = undefined
        if (this.job && !GameState.priorityList.isEnabled(this.job.priorityIdentifier)) {
            this.job.unAssign(this)
            this.job = undefined
        }
        this.worldMgr.ecs.getComponents(this.entity).get(RaiderInfoComponent).setBubbleTexture(this.job?.getJobBubble() || 'bubbleIdle')
    }

    private grabJobItem(elapsedMs: number, carryItem: MaterialEntity | undefined): boolean {
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
        return [RaiderTool.FREEZER_GUN, RaiderTool.LASER, RaiderTool.PUSHER_GUN].some((w) => this.hasTool(w))
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
            const scannerRange = this.stats.surveyRadius?.[this.level] ?? 0
            if (scannerRange) this.worldMgr.ecs.addComponent(this.entity, new ScannerComponent(scannerRange))
        }
    }

    isPrepared(job: Job): boolean {
        if (job.requiredTool === RaiderTool.DRILL) return this.canDrill(job.surface)
        return this.hasTool(job.requiredTool) && this.hasTraining(job.requiredTraining) && this.hasCapacity()
    }

    canDrill(surface: Surface | undefined): boolean {
        return !!surface && this.getDrillTimeSeconds(surface) > 0
    }

    hasCapacity(): boolean {
        return !this.carries
    }

    getCarryCapacity(): number {
        return 1
    }

    isReadyToTakeAJob(): boolean {
        return !this.job && !this.selected && !this.vehicle && this.canBeScared()
    }

    canBeScared() {
        return !this.isInBeam() && !this.slipped && !this.vehicle && !this.scared && !this.thrown && !this.resting && !(GameState.alarmMode && this.hasWeapon())
    }

    maxTools(): number {
        return this.stats.numOfToolsCanCarry[this.level] ?? 2
    }

    getRepairValue(): number {
        return this.stats.repairValue[this.level] || 0
    }

    getPosition(): Vector3 {
        return this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent).position.clone()
    }

    getPosition2D(): Vector2 {
        return this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent).getPosition2D()
    }

    setPosition(position: Vector3) {
        const surface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(position)
        const positionComponent = this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent)
        if (positionComponent) {
            positionComponent.position.copy(position)
            positionComponent.surface = surface
            positionComponent.markDirty()
        }
        if (this.carries) {
            const carriedPositionComponent = this.worldMgr.ecs.getComponents(this.carries.entity).get(PositionComponent)
            if (carriedPositionComponent) {
                this.carries.sceneEntity.getWorldPosition(carriedPositionComponent.position)
                carriedPositionComponent.surface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(carriedPositionComponent.position)
                carriedPositionComponent.markDirty()
            }
        }
    }

    getSurface(): Surface {
        return this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent).surface
    }
}
