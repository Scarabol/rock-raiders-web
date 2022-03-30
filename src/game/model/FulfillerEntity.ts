import { PositionalAudio } from 'three'
import { resetAudioSafe } from '../../audio/AudioUtil'
import { Sample } from '../../audio/Sample'
import { MovableEntityStats } from '../../cfg/GameStatsCfg'
import { NATIVE_UPDATE_INTERVAL } from '../../params'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { BeamUpAnimator, BeamUpEntity } from '../BeamUpAnimator'
import { WorldManager } from '../WorldManager'
import { AnimEntityActivity } from './activities/AnimEntityActivity'
import { RaiderActivity } from './activities/RaiderActivity'
import { Disposable } from './Disposable'
import { EntityStep } from './EntityStep'
import { EntityType } from './EntityType'
import { Job } from './job/Job'
import { JobState } from './job/JobState'
import { Surface } from './map/Surface'
import { TerrainPath } from './map/TerrainPath'
import { MaterialEntity } from './material/MaterialEntity'
import { MoveState } from './MoveState'
import { PathTarget } from './PathTarget'
import { Selectable } from './Selectable'
import { Updatable } from './Updateable'

export abstract class FulfillerEntity implements Selectable, BeamUpEntity, Updatable, Disposable {
    currentPath: TerrainPath = null
    level: number = 0
    selected: boolean
    job: Job = null
    followUpJob: Job = null
    beamUpAnimator: BeamUpAnimator = null
    workAudio: PositionalAudio

    protected constructor(readonly worldMgr: WorldManager) {
    }

    abstract isPrepared(job: Job): boolean

    abstract get sceneEntity(): AnimatedSceneEntity

    abstract get stats(): MovableEntityStats

    abstract findPathToTarget(target: PathTarget): TerrainPath

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

    getRouteActivity(): AnimEntityActivity {
        return AnimEntityActivity.Route
    }

    getSpeed(): number {
        return this.stats.RouteSpeed[this.level] * (this.isOnPath() ? this.stats.PathCoef : 1) * (this.isOnRubble() ? this.stats.RubbleCoef : 1)
    }

    isOnPath(): boolean {
        return this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(this.sceneEntity.position).isPath()
    }

    isOnRubble() {
        return this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(this.sceneEntity.position).hasRubble()
    }

    setJob(job: Job, followUpJob: Job = null) {
        if (this.job !== job) this.stopJob()
        this.job = job
        if (this.job) this.job.assign(this)
        this.followUpJob = followUpJob
        if (this.followUpJob) this.followUpJob.assign(this)
    }

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

    isSelectable(): boolean {
        return !this.selected && !this.beamUpAnimator
    }

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

    doubleSelect(): boolean {
        return false
    }

    deselect() {
        this.sceneEntity.selectionFrame.visible = false
        this.sceneEntity.selectionFrameDouble.visible = false
        this.selected = false
    }

    disposeFromWorld() {
        this.sceneEntity.disposeFromScene()
        this.workAudio = resetAudioSafe(this.workAudio)
    }

    beamUp() {
        this.stopJob()
        this.beamUpAnimator = new BeamUpAnimator(this)
    }

    update(elapsedMs: number) {
        this.work(elapsedMs)
        this.sceneEntity.update(elapsedMs)
        this.beamUpAnimator?.update(elapsedMs)
    }

    work(elapsedMs: number) {
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
        if (!this.workAudio) {
            if (workActivity === RaiderActivity.Drill) { // TODO implement work audio
                this.workAudio = this.sceneEntity.playPositionalAudio(Sample[Sample.SFX_Drill], true)
            } else if (workActivity === RaiderActivity.Place) {
                if (carryItem.entityType === EntityType.CRYSTAL) {
                    this.workAudio = this.sceneEntity.playPositionalAudio(Sample[Sample.SFX_PlaceCrystal], false)
                } else if (carryItem.entityType === EntityType.ORE) {
                    this.workAudio = this.sceneEntity.playPositionalAudio(Sample[Sample.SFX_PlaceOre], false)
                } else {
                    this.workAudio = this.sceneEntity.playPositionalAudio(Sample[Sample.SFX_Place], false)
                }
            }
        }
        this.sceneEntity.changeActivity(workActivity, () => {
            this.completeJob()
        }, this.job.getExpectedTimeLeft(this))
    }

    abstract grabJobItem(elapsedMs: number, carryItem: MaterialEntity): boolean

    moveToClosestTarget(target: PathTarget[], elapsedMs: number): MoveState {
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
            this.sceneEntity.changeActivity(this.getRouteActivity())
            return MoveState.MOVED
        }
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

    abstract dropCarried(): void

    canDrill(surface: Surface): boolean {
        if (!surface) return false
        return (this.stats[surface.surfaceType.statsDrillName]?.[this.level] || 0) > 0
    }

    canClear(): boolean {
        return false
    }

    abstract hasCapacity(): boolean

    isReadyToTakeAJob(): boolean {
        return !this.job && !this.selected && !this.beamUpAnimator
    }
}
