import { MovableEntity } from './MovableEntity'
import { Selectable, SelectionType } from '../../game/model/Selectable'
import { ResourceManager } from '../../resource/ResourceManager'
import { Job } from '../../game/model/job/Job'
import { Vector2, Vector3 } from 'three'
import { NATIVE_FRAMERATE } from '../../main'
import { clearIntervalSafe } from '../../core/Util'
import { Carryable } from './collect/Carryable'
import { SelectionEvent } from '../../event/LocalEvents'
import { BaseActivity } from './activities/BaseActivity'
import { RaiderSkill } from './RaiderSkill'
import { RaiderTool } from './RaiderTool'
import { JobType } from '../../game/model/job/JobType'

export abstract class FulfillerEntity extends MovableEntity implements Selectable {

    selectionType: SelectionType
    selected: boolean
    workInterval = null
    job: Job = null
    followUpJob: Job = null
    jobSubPos: Vector2 = null
    carries: Carryable = null // FIXME implement multi carry for vehicles

    protected constructor(selectionType: SelectionType, aeFilename: string) {
        super(ResourceManager.getAnimationEntityType(aeFilename))
        this.selectionType = selectionType
        this.group.userData = {'selectable': this}
        this.workInterval = setInterval(this.work.bind(this), 1000 / NATIVE_FRAMERATE) // TODO do not use interval, make work trigger itself (with timeout/interval) until work is done
    }

    resetWorkInterval() {
        this.workInterval = clearIntervalSafe(this.workInterval)
    }

    abstract work()

    dropItem() {
        if (!this.carries) return
        if (this.carryJoint) this.carryJoint.remove(this.carries.group)
        this.carries.group.position.copy(this.group.position)
        this.carries = null
    }

    pickupItem(item: Carryable) {
        this.carries = item
        if (this.carryJoint) this.carryJoint.add(this.carries.group)
        this.carries.group.position.set(0, 0, 0)
    }

    setJob(job: Job, followUpJob: Job = null) {
        if (this.job !== job) this.stopJob()
        if (job.type === JobType.SURFACE) this.dropItem()
        this.job = job
        if (this.job) this.job.assign(this)
        this.followUpJob = followUpJob
        if (this.followUpJob) this.followUpJob.assign(this)
    }

    abstract getStandActivity(): BaseActivity

    stopJob() {
        if (!this.job) return
        this.job.unassign(this)
        if (this.followUpJob) this.followUpJob.unassign(this)
        this.jobSubPos = null
        this.job = null
        this.followUpJob = null
        this.changeActivity(this.getStandActivity())
    }

    abstract hasTool(tool: RaiderTool)

    abstract hasSkill(skill: RaiderSkill)

    getSelectionType(): SelectionType {
        return this.selectionType
    }

    deselect() {
        this.selectionFrame.visible = false
        this.selected = false
    }

    abstract select(): SelectionEvent;

    abstract getSelectionCenter(): Vector3;

}
