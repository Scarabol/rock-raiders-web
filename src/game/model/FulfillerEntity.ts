import { PositionalAudio } from 'three'
import { resetAudioSafe } from '../../audio/AudioUtil'
import { Sample } from '../../audio/Sample'
import { FulfillerSceneEntity } from '../../scene/entities/FulfillerSceneEntity'
import { BeamUpAnimator } from '../BeamUpAnimator'
import { EntityManager } from '../EntityManager'
import { SceneManager } from '../SceneManager'
import { RaiderActivity } from './activities/RaiderActivity'
import { EntityType } from './EntityType'
import { Job } from './job/Job'
import { JobState } from './job/JobState'
import { Surface } from './map/Surface'
import { MaterialEntity } from './material/MaterialEntity'
import { MovableEntity } from './MovableEntity'
import { MoveState } from './MoveState'
import { PathTarget } from './PathTarget'
import { Selectable } from './Selectable'

export abstract class FulfillerEntity extends MovableEntity implements Selectable {

    level: number = 0
    selected: boolean
    job: Job = null
    followUpJob: Job = null
    carries: MaterialEntity = null
    inBeam: boolean = false
    beamUpAnimator: BeamUpAnimator = null
    workAudio: PositionalAudio

    protected constructor(sceneMgr: SceneManager, entityMgr: EntityManager, entityType: EntityType) {
        super(sceneMgr, entityMgr, entityType)
    }

    abstract isPrepared(job: Job): boolean

    abstract get sceneEntity(): FulfillerSceneEntity

    pickupItem(item: MaterialEntity) {
        this.carries = item
        this.sceneEntity.pickupEntity(item.sceneEntity)
    }

    dropItem() {
        if (!this.carries) return
        this.sceneEntity.dropEntity()
        this.carries = null
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
        this.dropItem()
        if (!this.job) return
        this.job.unAssign(this)
        if (this.followUpJob) this.followUpJob.unAssign(this)
        this.job = null
        this.followUpJob = null
        this.sceneEntity.changeActivity()
    }

    isSelectable(): boolean {
        return !this.selected && !this.inBeam
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

    removeFromScene() {
        this.sceneEntity.removeFromScene()
    }

    beamUp() {
        this.stopJob()
        this.inBeam = true
        this.beamUpAnimator = new BeamUpAnimator(this)
    }

    moveToClosestTarget(target: PathTarget[], elapsedMs: number): MoveState {
        const result = super.moveToClosestTarget(target, elapsedMs)
        this.job.setActualWorkplace(this.currentPath?.target)
        if (result === MoveState.TARGET_UNREACHABLE) {
            console.log('Entity could not move to job target, stopping job')
            this.stopJob()
        }
        return result
    }

    update(elapsedMs: number) {
        this.work(elapsedMs)
        this.sceneEntity.update(elapsedMs)
        this.beamUpAnimator?.update(elapsedMs)
    }

    work(elapsedMs: number) {
        if (!this.job || this.selected || this.inBeam) return
        if (this.job.jobState !== JobState.INCOMPLETE) {
            this.stopJob()
        } else {
            const carryItem = this.job.getCarryItem()
            if (carryItem && this.carries !== carryItem) {
                this.dropItem()
                if (this.moveToClosestTarget(carryItem.getPositionAsPathTargets(), elapsedMs)) {
                    this.sceneEntity.changeActivity(RaiderActivity.Collect, () => {
                        this.pickupItem(carryItem)
                    })
                }
            } else if (this.moveToClosestTarget(this.job.getWorkplaces(), elapsedMs) === MoveState.TARGET_REACHED) {
                if (this.job.isReadyToComplete()) {
                    const workActivity = this.job.getWorkActivity() || this.sceneEntity.getDefaultActivity()
                    if (!this.workAudio && workActivity === RaiderActivity.Drill) { // TODO implement work audio
                        this.workAudio = this.sceneEntity.playPositionalAudio(Sample[Sample.SFX_Drill], true)
                    }
                    this.sceneEntity.changeActivity(workActivity, () => {
                        this.completeJob()
                    }, this.job.getWorkDuration(this))
                } else {
                    this.sceneEntity.changeActivity()
                }
            }
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

    canDrill(surface: Surface): boolean {
        return (this.stats[surface.surfaceType.statsDrillName]?.[this.level] || 0) > 0
    }

}
