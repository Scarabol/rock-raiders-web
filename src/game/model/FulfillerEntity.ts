import { PositionalAudio } from 'three'
import { Sample } from '../../audio/Sample'
import { clearIntervalSafe } from '../../core/Util'
import { NATIVE_FRAMERATE } from '../../params'
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

    sceneEntity: FulfillerSceneEntity
    level: number = 0
    selected: boolean
    workInterval = null
    job: Job = null
    followUpJob: Job = null
    carries: MaterialEntity = null
    inBeam: boolean = false
    beamUpAnimator: BeamUpAnimator = null
    workAudio: PositionalAudio

    protected constructor(sceneMgr: SceneManager, entityMgr: EntityManager, entityType: EntityType) {
        super(sceneMgr, entityMgr, entityType)
        this.workInterval = setInterval(this.work.bind(this), 1000 / NATIVE_FRAMERATE) // TODO do not use interval, make work trigger itself (with timeout/interval) until work is done
    }

    abstract get stats()

    abstract isPrepared(job: Job): boolean

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
        this.workAudio?.stop()
        this.workAudio = null
        this.dropItem()
        if (!this.job) return
        this.job.unAssign(this)
        if (this.followUpJob) this.followUpJob.unAssign(this)
        this.job = null
        this.followUpJob = null
        this.sceneEntity.changeActivity()
    }

    deselect() {
        this.sceneEntity.selectionFrame.visible = false
        this.selected = false
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

    removeFromScene() {
        this.sceneEntity.removeFromScene()
        this.workInterval = clearIntervalSafe(this.workInterval)
    }

    beamUp() {
        this.stopJob()
        this.inBeam = true
        this.beamUpAnimator = new BeamUpAnimator(this)
    }

    moveToClosestTarget(target: PathTarget[]): MoveState {
        const result = super.moveToClosestTarget(target)
        this.job.setActualWorkplace(this.currentPath?.target)
        if (result === MoveState.TARGET_UNREACHABLE) {
            console.log('Entity could not move to job target, stopping job')
            this.stopJob()
        }
        return result
    }

    work() {
        if (!this.job || this.selected || this.inBeam) return
        if (this.job.jobState !== JobState.INCOMPLETE) {
            this.stopJob()
        } else {
            const carryItem = this.job.getCarryItem()
            if (carryItem && this.carries !== carryItem) {
                this.dropItem()
                if (this.moveToClosestTarget(carryItem.getPositionAsPathTargets())) {
                    this.sceneEntity.changeActivity(RaiderActivity.Collect, () => {
                        this.pickupItem(carryItem)
                    })
                }
            } else if (this.moveToClosestTarget(this.job.getWorkplaces()) === MoveState.TARGET_REACHED) {
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
        this.workAudio?.stop()
        this.workAudio = null
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
