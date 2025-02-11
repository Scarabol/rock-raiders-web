import { PositionalAudio, Vector2, Vector3 } from 'three'
import { SoundManager } from '../../../audio/SoundManager'
import { VehicleEntityStats } from '../../../cfg/GameStatsCfg'
import { DeselectAll, SelectionChanged, UpdateRadarEntityEvent } from '../../../event/LocalEvents'
import { DEV_MODE, ITEM_ACTION_RANGE_SQ, NATIVE_UPDATE_INTERVAL, TILESIZE } from '../../../params'
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
import { GenericDeathEvent, WorldLocationEvent } from '../../../event/WorldLocationEvent'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { RockMonsterBehaviorComponent } from '../../component/RockMonsterBehaviorComponent'
import { LastWillComponent } from '../../component/LastWillComponent'
import { RaiderScareComponent, RaiderScareRange } from '../../component/RaiderScareComponent'
import { MonsterStatsComponent } from '../../component/MonsterStatsComponent'
import { EventKey } from '../../../event/EventKeyEnum'
import { ScannerComponent } from '../../component/ScannerComponent'
import { MapMarkerChange, MapMarkerComponent, MapMarkerType } from '../../component/MapMarkerComponent'
import { GameConfig } from '../../../cfg/GameConfig'
import { EventBroker } from '../../../event/EventBroker'
import { GameState } from '../GameState'
import { TooltipComponent } from '../../component/TooltipComponent'
import { TooltipSpriteBuilder } from '../../../resource/TooltipSpriteBuilder'
import { LaserBeamTurretComponent } from '../../component/LaserBeamTurretComponent'
import { MaterialSpawner } from '../../factory/MaterialSpawner'
import { MovableStatsComponent } from '../../component/MovableStatsComponent'

export class VehicleEntity implements Updatable, JobFulfiller {
    readonly entityType: EntityType
    readonly worldMgr: WorldManager
    readonly entity: GameEntity
    currentPath?: TerrainPath
    level: number = 0
    job?: Job
    followUpJob?: Job
    workAudio?: PositionalAudio
    stats: VehicleEntityStats
    sceneEntity: AnimatedSceneEntity
    driver?: Raider
    callManJob?: ManVehicleJob
    engineSound?: PositionalAudio
    carriedItems: Set<MaterialEntity> = new Set()
    carriedVehicle?: VehicleEntity
    upgrades: Set<VehicleUpgrade> = new Set()
    loadItemDelayMs: number = 0
    upgrading: boolean = false
    portering: boolean = false
    carriedBy?: GameEntity

    constructor(entityType: EntityType, worldMgr: WorldManager, stats: VehicleEntityStats, aeNames: string[], readonly driverActivityStand: RaiderActivity | AnimEntityActivity.Stand = AnimEntityActivity.Stand, readonly driverActivityRoute: RaiderActivity | AnimEntityActivity.Stand = AnimEntityActivity.Stand) {
        this.entityType = entityType
        this.worldMgr = worldMgr
        this.stats = stats
        this.entity = this.worldMgr.ecs.addEntity()
        this.sceneEntity = new AnimatedSceneEntity()
        this.sceneEntity.flipCamera = true // XXX Why is this needed for vehicles and not pilot?
        aeNames.forEach((aeName) => this.sceneEntity.addAnimated(ResourceManager.getAnimatedData(aeName)))
        this.worldMgr.ecs.addComponent(this.entity, new MovableStatsComponent(stats))
        this.worldMgr.ecs.addComponent(this.entity, new AnimatedSceneEntityComponent(this.sceneEntity))
        this.worldMgr.ecs.addComponent(this.entity, new LastWillComponent(() => this.beamUp()))
        const objectKey = this.entityType.toLowerCase()
        const objectName = GameConfig.instance.objectNamesCfg.get(objectKey)
        const sfxKey = GameConfig.instance.objTtSFXs.get(objectKey) || ''
        if (objectName) this.worldMgr.ecs.addComponent(this.entity, new TooltipComponent(this.entity, objectName, sfxKey, () => {
            const health = this.worldMgr.ecs.getComponents(this.entity).get(HealthComponent)?.health ?? 0
            return TooltipSpriteBuilder.getTooltipSprite(objectName, health)
        }))
        this.worldMgr.entityMgr.addEntity(this.entity, this.entityType)
        if (entityType === EntityType.SMALL_MLP) {
            const weaponCfg = GameConfig.instance.weaponTypes.smallLazer
            this.worldMgr.ecs.addComponent(this.entity, new LaserBeamTurretComponent(weaponCfg))
        } else if (entityType === EntityType.LARGE_MLP || entityType === EntityType.LARGE_DIGGER) {
            const weaponCfg = GameConfig.instance.weaponTypes.bigLazer
            this.worldMgr.ecs.addComponent(this.entity, new LaserBeamTurretComponent(weaponCfg))
        }
    }

    update(elapsedMs: number) {
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
        if (!this.workAudio && this.job.workSoundVehicle) {
            this.workAudio = this.worldMgr.sceneMgr.addPositionalAudio(this.sceneEntity, this.job.workSoundVehicle, true)
        }
        if (workActivity === RaiderActivity.Drill) {
            this.sceneEntity.headTowards(this.job.surface.getCenterWorld2D())
            this.sceneEntity.setAnimation(workActivity)
            this.job.surface.addDrillTimeProgress(this.getDrillTimeSeconds(this.job.surface), elapsedMs, this.job.getWorkplace(this).targetLocation)
        } else if (workActivity === AnimEntityActivity.Stand) {
            this.sceneEntity.setAnimation(workActivity)
            this.completeJob()
        } else {
            this.sceneEntity.setAnimation(workActivity, () => {
                this.completeJob()
            }, this.job.getExpectedTimeLeft())
        }
    }

    beamUp(dropCarried: boolean = false) {
        this.carriedVehicle?.beamUp(dropCarried)
        this.carriedVehicle = undefined
        if (dropCarried) {
            const surface = this.getSurface()
            const pathSurface = surface.neighbors.find((n) => n.building?.entityType === EntityType.DOCKS)?.building?.primaryPathSurface
            const spawnSurface = [surface, ...surface.neighbors].find((s) => s.isWalkable()) ?? pathSurface
            if (spawnSurface) {
                for (let c = 0; c < this.stats.CostOre; c++) MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.ORE, spawnSurface.getRandomPosition())
                for (let c = 0; c < this.stats.CostCrystal; c++) MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.CRYSTAL, spawnSurface.getRandomPosition())
            }
            this.dropDriver()
        }
        const components = this.worldMgr.ecs.getComponents(this.entity)
        EventBroker.publish(new GenericDeathEvent(components.get(PositionComponent)))
        components.get(SelectionFrameComponent)?.deselect()
        this.worldMgr.ecs.removeComponent(this.entity, SelectionFrameComponent)
        this.worldMgr.ecs.removeComponent(this.entity, MapMarkerComponent)
        EventBroker.publish(new UpdateRadarEntityEvent(MapMarkerType.DEFAULT, this.entity, MapMarkerChange.REMOVE))
        this.worldMgr.ecs.removeComponent(this.entity, ScannerComponent)
        EventBroker.publish(new UpdateRadarEntityEvent(MapMarkerType.SCANNER, this.entity, MapMarkerChange.REMOVE))
        this.worldMgr.ecs.addComponent(this.entity, new BeamUpComponent(this))
        if (this.driver) this.worldMgr.entityMgr.removeEntity(this.driver.entity)
        this.worldMgr.entityMgr.removeEntity(this.entity)
    }

    disposeFromWorld() {
        this.worldMgr.sceneMgr.disposeSceneEntity(this.sceneEntity)
        this.workAudio = SoundManager.stopAudio(this.workAudio)
        this.engineSound = SoundManager.stopAudio(this.engineSound)
        this.worldMgr.entityMgr.removeEntity(this.entity)
        this.worldMgr.ecs.removeEntity(this.entity)
    }

    /*
    Movement
     */

    findShortestPath(targets: PathTarget[] | PathTarget | undefined): TerrainPath | undefined {
        return this.worldMgr.sceneMgr.terrain.pathFinder.findShortestPath(this.getPosition2D(), targets, this.stats, 1)
    }

    private moveToClosestTarget(target: PathTarget, elapsedMs: number): MoveState {
        const result = this.moveToClosestTargetInternal(target, elapsedMs)
        if (result === MoveState.MOVED) {
            this.onEntityMoved()
        } else if (result === MoveState.TARGET_UNREACHABLE) {
            console.warn('Vehicle could not move to job target, stopping job', this.job, target)
            this.stopJob()
        }
        return result
    }

    onEntityMoved() {
        const vehiclePosition2D = this.sceneEntity.position2D
        this.worldMgr.entityMgr.rockMonsters.forEach((rocky) => {
            const components = this.worldMgr.ecs.getComponents(rocky)
            const rockySceneEntity = components.get(AnimatedSceneEntityComponent).sceneEntity
            if (rockySceneEntity.currentAnimation === RockMonsterActivity.Unpowered) {
                const positionComponent = components.get(PositionComponent)
                const rockyPosition2D = positionComponent.getPosition2D()
                const wakeRadius = components.get(MonsterStatsComponent).stats.WakeRadius
                if (vehiclePosition2D.distanceToSquared(rockyPosition2D) < Math.pow(wakeRadius + this.stats.CollRadius, 2)) {
                    rockySceneEntity.setAnimation(RockMonsterActivity.WakeUp, () => {
                        this.worldMgr.ecs.addComponent(rocky, new RaiderScareComponent(RaiderScareRange.ROCKY))
                        this.worldMgr.ecs.addComponent(rocky, new RockMonsterBehaviorComponent())
                        EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_MONSTER, positionComponent))
                    })
                }
            }
        })
    }

    private moveToClosestTargetInternal(target: PathTarget, elapsedMs: number): MoveState {
        if (!target) return MoveState.TARGET_UNREACHABLE
        if (!this.currentPath || !target.targetLocation.equals(this.currentPath.target.targetLocation)) {
            const path = this.findShortestPath(target)
            this.currentPath = path && path.locations.length > 0 ? path : undefined
            if (!this.currentPath) return MoveState.TARGET_UNREACHABLE
        }
        const step = this.determineStep(elapsedMs)
        if (step.targetReached) {
            if (target.building) this.sceneEntity.headTowards(target.building.primarySurface.getCenterWorld2D())
            return MoveState.TARGET_REACHED
        } else {
            this.sceneEntity.headTowards(this.currentPath.firstLocation)
            this.setPosition(this.getPosition().add(step.vec))
            this.sceneEntity.setAnimation(this.getRouteActivity())
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
        const entitySpeed = this.getSpeed() * elapsedMs / NATIVE_UPDATE_INTERVAL // XXX use average speed between current and target position
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

    getSpeed(): number {
        return this.stats.RouteSpeed[this.level]
    }

    getRouteActivity(): AnimEntityActivity {
        return AnimEntityActivity.Route
    }

    getDefaultAnimationName(): AnimEntityActivity {
        return AnimEntityActivity.Stand
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
        const selectionFrameComponent = this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)
        primary ? selectionFrameComponent?.select() : selectionFrameComponent?.selectSecondary()
        this.sceneEntity.setAnimation(AnimEntityActivity.Stand)
        this.workAudio = SoundManager.stopAudio(this.workAudio)
        return true
    }

    deselect() {
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.deselect()
    }

    isSelectable(): boolean {
        return !this.selected && !this.isInBeam() && !this.upgrading && !this.portering && !this.carriedBy
    }

    isInBeam(): boolean {
        return !this.worldMgr.ecs.getComponents(this.entity).has(SelectionFrameComponent)
    }

    /*
    Working on Jobs
     */

    stopJob() {
        this.workAudio = SoundManager.stopAudio(this.workAudio)
        this.dropCarried(false)
        if (!this.job) return
        this.job.unAssign(this)
        if (this.followUpJob) this.followUpJob.unAssign(this)
        this.job = undefined
        this.followUpJob = undefined
        this.sceneEntity.setAnimation(AnimEntityActivity.Stand)
    }

    private completeJob() {
        this.workAudio = SoundManager.stopAudio(this.workAudio)
        this.job?.onJobComplete(this)
        this.sceneEntity.setAnimation(AnimEntityActivity.Stand)
        if (this.job?.jobState === JobState.INCOMPLETE) return
        if (this.job) this.job.unAssign(this)
        this.job = this.followUpJob
        this.followUpJob = undefined
        if (this.job && !GameState.priorityList.isEnabled(this.job.priorityIdentifier)) {
            this.job.unAssign(this)
            this.job = undefined
        }
    }

    getDrillTimeSeconds(surface: Surface): number {
        if (!surface) return 0
        return this.stats[surface.surfaceType.statsDrillName]?.[this.level] || 0
    }

    setJob(job: Job, followUpJob?: Job) {
        if (!this.driver || this.portering) return
        if (this.job !== job) this.stopJob()
        this.job = job
        if (this.job) this.job.assign(this)
        this.followUpJob = followUpJob
        if (this.followUpJob) this.followUpJob.assign(this)
    }

    private grabJobItem(elapsedMs: number, carryItem: MaterialEntity | undefined): boolean {
        if (!carryItem) {
            return true // nothing to do here
        } else if (!this.carriedItems.has(carryItem)) {
            const positionAsPathTarget = PathTarget.fromLocation(carryItem.getPosition2D(), ITEM_ACTION_RANGE_SQ)
            if (this.moveToClosestTarget(positionAsPathTarget, elapsedMs) === MoveState.TARGET_REACHED) {
                this.sceneEntity.setAnimation(AnimEntityActivity.Stand)
                if (this.loadItemDelayMs > 0) {
                    this.loadItemDelayMs -= elapsedMs
                } else {
                    this.carriedItems.add(carryItem)
                    this.sceneEntity.pickupEntity(carryItem.sceneEntity)
                    return true
                }
            } else {
                this.loadItemDelayMs = 500
            }
            return false
        } else if (this.hasCapacity()) {
            const fulfillerPos = this.getPosition2D()
            const matNearby = this.worldMgr.entityMgr.materials.find((m) => { // XXX Move to entity manager and optimize with quad tree
                if (m.entityType !== this.job.carryItem.entityType || m.carryJob.hasFulfiller() || m.carryJob.jobState !== JobState.INCOMPLETE) return false
                const pos = this.worldMgr.ecs.getComponents(m.entity)?.get(PositionComponent)
                if (!pos) return false
                return pos.getPosition2D().distanceToSquared(fulfillerPos) < Math.pow(3 * TILESIZE, 2) // XXX Improve range, since this is executed on each frame
            })
            if (matNearby) {
                const workplace = this.job.getWorkplace(this)
                if (workplace.building) {
                    this.job = matNearby.carryJob
                    this.job.assign(this)
                } else if (workplace.site) {
                    if (!workplace.site.needs(carryItem.entityType)) {
                        return true
                    }
                    this.job = matNearby.carryJob
                    this.job.assign(this)
                }
            }
            return true
        }
        return true
    }

    dropCarried(unAssignFromSite: boolean): MaterialEntity[] {
        if (this.carriedItems.size < 1) return []
        if (unAssignFromSite) this.carriedItems.forEach((i) => i.carryJob?.target?.site?.unAssign(i))
        this.sceneEntity.removeAllCarried()
        const carriedEntities: MaterialEntity[] = []
        this.carriedItems.forEach((carried) => {
            const floorPosition = carried.worldMgr.sceneMgr.terrain.getFloorPosition(carried.getPosition2D())
            carried.setPosition(floorPosition)
            carried.worldMgr.sceneMgr.addSceneEntity(carried.sceneEntity)
            carriedEntities.push(carried)
        })
        this.carriedItems.clear()
        return carriedEntities
    }

    addDriver(driver: Raider) {
        if (this.driver !== driver) this.dropDriver()
        this.driver = driver
        this.driver.vehicle = this
        if (this.stats.InvisibleDriver) {
            this.driver.sceneEntity.visible = false
        } else {
            const positionComponent = this.worldMgr.ecs.getComponents(this.driver.entity).get(PositionComponent)
            positionComponent.position.set(0, 0, 0)
            positionComponent.markDirty()
            this.sceneEntity.addDriver(this.driver.sceneEntity)
            this.sceneEntity.restartAnimation()
        }
        this.worldMgr.ecs.removeComponent(this.driver.entity, MapMarkerComponent)
        EventBroker.publish(new UpdateRadarEntityEvent(MapMarkerType.DEFAULT, this.driver.entity, MapMarkerChange.REMOVE))
        const driverScannerComponent = this.worldMgr.ecs.getComponents(this.driver.entity).get(ScannerComponent)
        if (driverScannerComponent) this.worldMgr.ecs.addComponent(this.entity, driverScannerComponent)
        if (this.stats.EngineSound && !this.engineSound && !DEV_MODE) this.engineSound = this.worldMgr.sceneMgr.addPositionalAudio(this.sceneEntity, this.stats.EngineSound, true)
        if (this.selected) EventBroker.publish(new SelectionChanged(this.worldMgr.entityMgr))
    }

    dropDriver() {
        const surface = this.getSurface()
        const walkableSurface = [surface, ...surface.neighbors].find((s) => s.isWalkable() || s.building?.entityType === EntityType.DOCKS)
        if (!walkableSurface) return
        this.stopJob()
        if (!this.driver) return
        this.sceneEntity.removeDriver()
        this.driver.vehicle = undefined
        const hopOffSpot = walkableSurface.building?.entityType === EntityType.DOCKS ? walkableSurface.building.primaryPathSurface.getRandomPosition() : walkableSurface.getRandomPosition()
        const floorPosition = this.driver.worldMgr.sceneMgr.getFloorPosition(hopOffSpot)
        this.driver.setPosition(floorPosition)
        this.driver.sceneEntity.rotation.y = this.sceneEntity.heading
        this.driver.worldMgr.sceneMgr.addSceneEntity(this.driver.sceneEntity)
        this.driver.sceneEntity.setAnimation(AnimEntityActivity.Stand)
        this.worldMgr.ecs.addComponent(this.driver.entity, new MapMarkerComponent(MapMarkerType.DEFAULT))
        EventBroker.publish(new UpdateRadarEntityEvent(MapMarkerType.DEFAULT, this.driver.entity, MapMarkerChange.UPDATE, floorPosition))
        this.driver.sceneEntity.visible = true
        const scannerComponent = this.worldMgr.ecs.getComponents(this.entity).get(ScannerComponent)
        if (scannerComponent) this.worldMgr.ecs.getComponents(this.driver.entity).add(scannerComponent)
        const scannerRange = this.stats.SurveyRadius?.[this.level] ?? 0
        if (!scannerRange) {
            this.worldMgr.ecs.removeComponent(this.entity, ScannerComponent)
            EventBroker.publish(new UpdateRadarEntityEvent(MapMarkerType.SCANNER, this.entity, MapMarkerChange.UPDATE, this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent).position))
        }
        this.driver = undefined
        this.engineSound = SoundManager.stopAudio(this.engineSound)
        if (this.selected) EventBroker.publish(new SelectionChanged(this.worldMgr.entityMgr))
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

    canDrill(surface: Surface | undefined): boolean {
        return !!surface && this.getDrillTimeSeconds(surface) > 0
    }

    canClear(): boolean {
        return this.stats.CanClearRubble
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

    unblockBuildingPowerPath() {
        const surface = this.getSurface()
        if (surface.building) {
            const walkableNeighbor = surface.neighbors.find((n) => !n.site && n.isWalkable() && !n.building)
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
        const components = this.worldMgr.ecs.getComponents(this.entity)
        components.get(HealthComponent).rockFallDamage = GameConfig.instance.getRockFallDamage(this.entityType, this.level)
        const scannerRange = this.stats.SurveyRadius?.[this.level] ?? 0
        if (scannerRange) this.worldMgr.ecs.addComponent(this.entity, new ScannerComponent(scannerRange))
    }

    getRepairValue(): number {
        return 0
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
        this.carriedItems.forEach((carriedItem) => {
            const carriedPositionComponent = this.worldMgr.ecs.getComponents(carriedItem.entity).get(PositionComponent)
            if (carriedPositionComponent) {
                carriedItem.sceneEntity.getWorldPosition(carriedPositionComponent.position)
                carriedPositionComponent.surface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(carriedPositionComponent.position)
                carriedPositionComponent.markDirty()
            }
        })
    }

    getSurface(): Surface {
        return this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent).surface
    }

    private getNearbySurfaces(): Surface[] {
        const surface = this.getSurface()
        return [surface, ...surface.neighbors]
    }

    canLoad(): boolean {
        const surfsToCheck = this.getNearbySurfaces()
        const canPickupVehicle = this.stats.CarryVehicles && !this.carriedVehicle && !this.portering && this.worldMgr.entityMgr.vehicles.some((v) => v.stats.VehicleCanBeCarried && surfsToCheck.includes(v.getSurface()))
        const vehicleSurface = this.getSurface()
        const canPickupMaterial = this.worldMgr.entityMgr.materials.some((m) => m.getSurface() === vehicleSurface)
        return canPickupVehicle || canPickupMaterial
    }

    pickupNearbyEntity(): void {
        const surfsToCheck = this.getNearbySurfaces()
        if (this.stats.CarryVehicles && !this.carriedVehicle) {
            this.carriedVehicle = this.worldMgr.entityMgr.vehicles.filter((v) => v.stats.VehicleCanBeCarried && surfsToCheck.includes(v.getSurface())).random()
            if (this.carriedVehicle) {
                this.loadCarriedVehicle()
                return
            }
        }
        // TODO Find closest material to pick up
        console.warn('Picking up nearby material not yet implemented')
    }

    private loadCarriedVehicle() {
        if (!this.carriedVehicle) return
        this.portering = true
        this.carriedVehicle.carriedBy = this.entity
        if (this.carriedVehicle.selected) EventBroker.publish(new DeselectAll()) // XXX Only remove carried vehicle from selection
        if (this.selected) EventBroker.publish(new SelectionChanged(this.worldMgr.entityMgr))
        this.sceneEntity.headTowards(this.carriedVehicle.getPosition2D())
        this.sceneEntity.setAnimation('Activity_Opening', () => {
            if (!this.carriedVehicle) return // happens for beamup during load/unload
            this.carriedVehicle.sceneEntity.rotation.set(0, Math.PI, 0) // XXX Why is rotation needed for float on animation?
            this.sceneEntity.pickupEntity(this.carriedVehicle.sceneEntity)
            this.carriedVehicle.sceneEntity.position.y = -8 // XXX Calculate offset from world positions?
            this.carriedVehicle.sceneEntity.setAnimation('Activity_FloatOn', () => {
                if (!this.carriedVehicle) return // happens for beamup during load/unload
                this.carriedVehicle.sceneEntity.rotation.set(0, 0, 0)
                this.carriedVehicle.sceneEntity.position.setScalar(0)
                this.carriedVehicle.sceneEntity.setAnimation(AnimEntityActivity.Stand)
                this.sceneEntity.setAnimation('Activity_Closing', () => {
                    this.sceneEntity.setAnimation(AnimEntityActivity.Stand)
                    this.portering = false
                    if (this.selected) EventBroker.publish(new SelectionChanged(this.worldMgr.entityMgr))
                })
            })
        })
    }

    unloadVehicle() {
        const accessibleNeighbors = this.getSurface().neighbors.filter((n) => n.isWalkable()) // XXX Use accessible surface for the carried type
        const direction = this.sceneEntity.getWorldDirection(new Vector3())
        const targetedPosition = this.getSurface().getCenterWorld2D().add(new Vector2(direction.x, direction.z).setLength(TILESIZE))
        const targetedSurface = this.getSurface().terrain.getSurfaceFromWorld2D(targetedPosition)
        const unloadSurface = accessibleNeighbors.includes(targetedSurface) ? targetedSurface : accessibleNeighbors.random()
        if (!this.carriedVehicle || !unloadSurface) return
        this.portering = true
        const dropOffVehicle = this.carriedVehicle
        this.carriedVehicle = undefined
        if (this.selected) EventBroker.publish(new SelectionChanged(this.worldMgr.entityMgr))
        this.sceneEntity.headTowards(unloadSurface.getCenterWorld2D())
        this.sceneEntity.setAnimation('Activity_Opening', () => {
            this.sceneEntity.removeAllCarried()
            this.worldMgr.sceneMgr.addSceneEntity(dropOffVehicle.sceneEntity)
            dropOffVehicle.sceneEntity.position.y -= 8 // XXX Calculate offset from world positions?
            dropOffVehicle.sceneEntity.setAnimation('Activity_FloatOff', () => {
                dropOffVehicle.sceneEntity.rotation.y += Math.PI // XXX Why is rotation needed for float off animation?
                const unloadPosition = unloadSurface.getCenterWorld()
                dropOffVehicle.sceneEntity.position.copy(unloadPosition)
                dropOffVehicle.setPosition(unloadPosition)
                dropOffVehicle.sceneEntity.setAnimation(AnimEntityActivity.Stand)
                dropOffVehicle.carriedBy = undefined
                this.sceneEntity.setAnimation('Activity_Closing', () => {
                    this.sceneEntity.setAnimation(AnimEntityActivity.Stand)
                    this.portering = false
                    if (this.selected) EventBroker.publish(new SelectionChanged(this.worldMgr.entityMgr))
                })
            })
        })
    }
}
