import { PositionalAudio } from 'three'
import { resetAudioSafe } from '../../../audio/AudioUtil'
import { Sample } from '../../../audio/Sample'
import { VehicleEntityStats } from '../../../cfg/GameStatsCfg'
import { EventBus } from '../../../event/EventBus'
import { SelectionChanged } from '../../../event/LocalEvents'
import { NATIVE_UPDATE_INTERVAL } from '../../../params'
import { VehicleSceneEntity } from '../../../scene/entities/VehicleSceneEntity'
import { BeamUpAnimator, BeamUpEntity } from '../../BeamUpAnimator'
import { WorldManager } from '../../WorldManager'
import { AnimEntityActivity } from '../activities/AnimEntityActivity'
import { RaiderActivity } from '../activities/RaiderActivity'
import { Disposable } from '../Disposable'
import { EntityStep } from '../EntityStep'
import { EntityType } from '../EntityType'
import { Job } from '../job/Job'
import { JobState } from '../job/JobState'
import { ManVehicleJob } from '../job/ManVehicleJob'
import { MoveJob } from '../job/raider/MoveJob'
import { Surface } from '../map/Surface'
import { TerrainPath } from '../map/TerrainPath'
import { Crystal } from '../material/Crystal'
import { MaterialEntity } from '../material/MaterialEntity'
import { Ore } from '../material/Ore'
import { MoveState } from '../MoveState'
import { PathTarget } from '../PathTarget'
import { Raider } from '../raider/Raider'
import { RaiderTool } from '../raider/RaiderTool'
import { RaiderTraining } from '../raider/RaiderTraining'
import { Selectable } from '../Selectable'
import { Updatable } from '../Updateable'

export class VehicleEntity implements Selectable, BeamUpEntity, Updatable, Disposable {
    currentPath: TerrainPath = null
    level: number = 0
    selected: boolean
    job: Job = null
    followUpJob: Job = null
    beamUpAnimator: BeamUpAnimator = null
    workAudio: PositionalAudio
    stats: VehicleEntityStats
    sceneEntity: VehicleSceneEntity
    driver: Raider = null
    callManJob: ManVehicleJob = null
    engineSound: PositionalAudio = null
    carriedItems: Set<MaterialEntity> = new Set()

    constructor(readonly worldMgr: WorldManager, stats: VehicleEntityStats, sceneEntity: VehicleSceneEntity, readonly driverActivityStand: RaiderActivity = RaiderActivity.Stand, readonly driverActivityRoute: RaiderActivity = RaiderActivity.Stand) {
        this.stats = stats
        this.sceneEntity = sceneEntity
        this.sceneEntity.speed = this.getSpeed() // TODO update speed on entity upgrade
    }

    update(elapsedMs: number) {
        this.work(elapsedMs)
        this.sceneEntity.update(elapsedMs)
        this.beamUpAnimator?.update(elapsedMs)
    }

    beamUp() {
        this.dropDriver()
        this.beamUpAnimator = new BeamUpAnimator(this)
        const surface = this.sceneEntity.surfaces[0]
        for (let c = 0; c < this.stats.CostOre; c++) {
            this.worldMgr.entityMgr.placeMaterial(new Ore(this.worldMgr), surface.getRandomPosition())
        }
        for (let c = 0; c < this.stats.CostCrystal; c++) {
            this.worldMgr.entityMgr.placeMaterial(new Crystal(this.worldMgr), surface.getRandomPosition())
        }
        this.worldMgr.entityMgr.vehicles.remove(this)
        this.worldMgr.entityMgr.vehiclesInBeam.add(this)
    }

    disposeFromWorld() {
        this.sceneEntity.disposeFromScene()
        this.workAudio = resetAudioSafe(this.workAudio)
        this.engineSound = resetAudioSafe(this.engineSound)
        this.worldMgr.entityMgr.vehicles.remove(this)
        this.worldMgr.entityMgr.vehiclesUndiscovered.remove(this)
        this.worldMgr.entityMgr.vehiclesInBeam.remove(this)
        this.engineSound = resetAudioSafe(this.engineSound)
        this.worldMgr.entityMgr.vehicles.remove(this)
        this.worldMgr.entityMgr.vehiclesUndiscovered.remove(this)
        this.worldMgr.entityMgr.vehiclesInBeam.remove(this)
    }

    /*
    Movement
     */

    findPathToTarget(target: PathTarget): TerrainPath {
        return this.worldMgr.sceneMgr.terrain.pathFinder.findPath(this.sceneEntity.position2D, target, this.stats, false)
    }

    private moveToClosestTarget(target: PathTarget[], elapsedMs: number): MoveState {
        const result = this.moveToClosestTargetInternal(target, elapsedMs)
        this.job.setActualWorkplace(this.currentPath?.target)
        if (result === MoveState.TARGET_UNREACHABLE) {
            console.log('Entity could not move to job target, stopping job')
            this.stopJob()
        }
        return result
    }

    private moveToClosestTargetInternal(target: PathTarget[], elapsedMs: number): MoveState {
        if (!target || target.length < 1) return MoveState.TARGET_UNREACHABLE
        if (!this.currentPath || !target.some((t) => t.targetLocation.equals(this.currentPath.target.targetLocation))) {
            const paths = target.map((t) => this.findPathToTarget(t)).filter((p) => !!p)
                .sort((l, r) => l.lengthSq - r.lengthSq)
            this.currentPath = paths.length > 0 ? paths[0] : null
            if (!this.currentPath) return MoveState.TARGET_UNREACHABLE
        }
        const step = this.determineStep(elapsedMs)
        if (step.targetReached) {
            this.sceneEntity.headTowards(this.currentPath.target.getFocusPoint())
            return MoveState.TARGET_REACHED
        } else {
            this.sceneEntity.headTowards(this.currentPath.firstLocation)
            this.sceneEntity.position.add(step.vec)
            this.sceneEntity.changeActivity()
            return MoveState.MOVED
        }
    }

    private determineStep(elapsedMs: number): EntityStep {
        const targetWorld = this.worldMgr.sceneMgr.getFloorPosition(this.currentPath.firstLocation)
        targetWorld.y += this.sceneEntity.floorOffset
        const step = new EntityStep(targetWorld.sub(this.sceneEntity.position))
        const stepLengthSq = step.vec.lengthSq()
        const entitySpeed = this.getSpeed() * elapsedMs / NATIVE_UPDATE_INTERVAL // TODO use average speed between current and target position
        const entitySpeedSq = entitySpeed * entitySpeed
        if (this.currentPath.locations.length > 1) {
            if (stepLengthSq <= entitySpeedSq) {
                this.currentPath.locations.shift()
                return this.determineStep(elapsedMs)
            }
        } else if (stepLengthSq <= entitySpeedSq + this.currentPath.target.radiusSq) {
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

    isInSelection(): boolean {
        return this.isSelectable() || this.selected
    }

    select(): boolean {
        if (!this.isSelectable()) return false
        this.sceneEntity.selectionFrame.visible = true
        this.selected = true
        this.sceneEntity.changeActivity()
        return true
    }

    deselect() {
        this.sceneEntity.selectionFrame.visible = false
        this.sceneEntity.selectionFrameDouble.visible = false
        this.selected = false
    }

    isSelectable(): boolean {
        return !this.selected && !this.beamUpAnimator
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
        this.sceneEntity.changeActivity()
    }

    private work(elapsedMs: number) {
        if (!this.job || this.selected || !!this.beamUpAnimator) return
        if (this.job.jobState !== JobState.INCOMPLETE) {
            this.stopJob()
            return
        }
        const carryItem = this.job.getCarryItem()
        const grabbedJobItem = !carryItem || this.grabJobItem(elapsedMs, carryItem)
        if (!grabbedJobItem) return
        const workplaceReached = this.moveToClosestTarget(this.job.getWorkplaces(), elapsedMs) === MoveState.TARGET_REACHED
        if (!workplaceReached) return
        if (!this.job.isReadyToComplete()) {
            this.sceneEntity.changeActivity()
            return
        }
        const workActivity = this.job.getWorkActivity() || this.sceneEntity.getDefaultActivity()
        if (!this.workAudio && workActivity === RaiderActivity.Drill) { // TODO implement work audio
            this.workAudio = this.sceneEntity.playPositionalAudio(Sample[Sample.SFX_Drill], true)
        }
        this.sceneEntity.changeActivity(workActivity, () => {
            this.completeJob()
        }, this.job.getExpectedTimeLeft())
    }

    private completeJob() {
        this.workAudio = resetAudioSafe(this.workAudio)
        this.job?.onJobComplete()
        this.sceneEntity.changeActivity()
        if (this.job?.jobState === JobState.INCOMPLETE) return
        if (this.job) this.job.unAssign(this)
        this.job = this.followUpJob
        this.followUpJob = null
    }

    getDrillTime(surface: Surface): number {
        if (!surface) return 0
        return (this.stats[surface.surfaceType.statsDrillName]?.[this.level] || 0)
    }

    setJob(job: Job, followUpJob: Job = null) {
        if (!this.driver) return
        if (!this.driver) return
        if (this.job !== job) this.stopJob()
        this.job = job
        if (this.job) this.job.assign(this)
        this.followUpJob = followUpJob
        if (this.followUpJob) this.followUpJob.assign(this)
    }

    grabJobItem(elapsedMs: number, carryItem: MaterialEntity): boolean {
        if (this.carriedItems.has(carryItem)) return true
        if (this.moveToClosestTarget(carryItem.getPositionAsPathTargets(), elapsedMs) === MoveState.TARGET_REACHED) {
            this.sceneEntity.changeActivity(AnimEntityActivity.Stand, () => {
                this.carriedItems.add(carryItem)
                this.sceneEntity.pickupEntity(carryItem.sceneEntity)
            })
        }
        return false
    }

    dropCarried() {
        if (this.carriedItems.size < 1) return
        this.sceneEntity.dropAllEntities()
        this.carriedItems.clear()
    }

    addDriver(driver: Raider) {
        this.driver = driver
        this.driver.vehicle = this
        if (!this.stats.InvisibleDriver) {
            this.sceneEntity.addDriver(this.driver.sceneEntity)
        } else {
            this.driver.sceneEntity.disposeFromScene()
        }
        if (this.stats.EngineSound && !this.engineSound) this.engineSound = this.sceneEntity.playPositionalAudio(this.stats.EngineSound, true)
        if (this.selected) EventBus.publishEvent(new SelectionChanged(this.worldMgr.entityMgr))
    }

    dropDriver() {
        this.stopJob()
        if (!this.driver) return
        this.sceneEntity.removeDriver()
        this.driver.vehicle = null
        this.driver.sceneEntity.addToScene(this.sceneEntity.position2D, this.sceneEntity.getHeading())
        this.driver.sceneEntity.changeActivity()
        this.driver = null
        this.engineSound = resetAudioSafe(this.engineSound)
        if (this.selected) EventBus.publishEvent(new SelectionChanged(this.worldMgr.entityMgr))
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
        const carryType = job.getCarryItem()?.entityType
        return (job.getRequiredTool() === RaiderTool.DRILL && this.canDrill(job.surface))
            || (job.getRequiredTool() === RaiderTool.SHOVEL && this.canClear())
            || ((carryType === EntityType.ORE || carryType === EntityType.CRYSTAL || carryType === EntityType.ELECTRIC_FENCE) && this.hasCapacity())
    }

    doubleSelect(): boolean {
        if (!this.selected || !this.stats.CanDoubleSelect || !this.driver) return false
        this.sceneEntity.selectionFrame.visible = false
        this.sceneEntity.selectionFrameDouble.visible = true
        return true
    }

    canDrill(surface: Surface): boolean {
        return this.getDrillTime(surface) > 0
    }

    canClear(): boolean {
        return !!this.stats.CanClearRubble
    }

    hasCapacity(): boolean {
        return this.carriedItems.size < this.getCarryCapacity()
    }

    isReadyToTakeAJob(): boolean {
        return !this.job && !this.selected && !this.beamUpAnimator && !!this.driver
    }

    getCarryCapacity(): number {
        return this.stats.MaxCarry?.[this.level] || 0
    }

    unblockTeleporter() {
        const blockedTeleporter = this.sceneEntity.surfaces.find((s) => !!s.building?.teleport && s.building?.primaryPathSurface === s)
        if (blockedTeleporter) {
            const walkableNeighbor = blockedTeleporter.neighbors.find((n) => !n.site && n.isWalkable() && !n.building?.teleport)
            if (walkableNeighbor) this.setJob(new MoveJob(walkableNeighbor.getCenterWorld2D()))
        }
    }

    getDriverActivity() {
        return this.sceneEntity.activity === AnimEntityActivity.Stand ? this.driverActivityStand : this.driverActivityRoute
    }
}
