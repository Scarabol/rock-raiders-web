import { PositionalAudio } from 'three'
import { resetAudioSafe } from '../../audio/AudioUtil'
import { Sample } from '../../audio/Sample'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { BeamUpAnimator, BeamUpEntity } from '../BeamUpAnimator'
import { EntityManager } from '../EntityManager'
import { SceneManager } from '../SceneManager'
import { RaiderActivity } from './activities/RaiderActivity'
import { Job } from './job/Job'
import { JobState } from './job/JobState'
import { Surface } from './map/Surface'
import { MaterialEntity } from './material/MaterialEntity'
import { MovableEntity } from './MovableEntity'
import { MoveState } from './MoveState'
import { PathTarget } from './PathTarget'
import { Selectable } from './Selectable'
import { Disposable } from './Disposable'
import { Updatable } from './Updateable'

export abstract class FulfillerEntity extends MovableEntity implements Selectable, BeamUpEntity, Updatable, Disposable {
    selected: boolean
    job: Job = null
    followUpJob: Job = null
    beamUpAnimator: BeamUpAnimator = null
    workAudio: PositionalAudio

    protected constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr)
    }

    abstract isPrepared(job: Job): boolean

    abstract get sceneEntity(): AnimatedSceneEntity

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
        if (!this.workAudio && workActivity === RaiderActivity.Drill) { // TODO implement work audio
            this.workAudio = this.sceneEntity.playPositionalAudio(Sample[Sample.SFX_Drill], true)
        }
        this.sceneEntity.changeActivity(workActivity, () => {
            this.completeJob()
        }, this.job.getWorkDuration(this))
    }

    abstract grabJobItem(elapsedMs: number, carryItem: MaterialEntity): boolean

    moveToClosestTarget(target: PathTarget[], elapsedMs: number): MoveState {
        const result = super.moveToClosestTarget(target, elapsedMs)
        this.job.setActualWorkplace(this.currentPath?.target)
        if (result === MoveState.TARGET_UNREACHABLE) {
            console.log('Entity could not move to job target, stopping job')
            this.stopJob()
        }
        return result
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
