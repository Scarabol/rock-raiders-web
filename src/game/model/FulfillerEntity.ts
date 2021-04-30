import { Vector3 } from 'three'
import { clearIntervalSafe } from '../../core/Util'
import { SelectionEvent } from '../../event/LocalEvents'
import { NATIVE_FRAMERATE } from '../../params'
import { CollectableEntity } from './collect/CollectableEntity'
import { Job } from './job/Job'
import { MovableEntity } from './MovableEntity'
import { PathTarget } from './PathTarget'
import { RaiderSkill } from './raider/RaiderSkill'
import { RaiderTool } from './raider/RaiderTool'
import { Selectable, SelectionType } from './Selectable'

export abstract class FulfillerEntity extends MovableEntity implements Selectable {

    selectionType: SelectionType
    selected: boolean
    workInterval = null
    job: Job = null
    followUpJob: Job = null
    carries: CollectableEntity = null
    jobWorkplaces: PathTarget[] = []

    protected constructor(aeFilename: string, selectionType: SelectionType) {
        super(aeFilename)
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
        if (this.carryJoint) {
            this.carryJoint.remove(this.carries.group)
            this.carryJoint.getWorldPosition(this.carries.group.position)
        } else {
            this.carries.group.position.copy(this.worldMgr.getFloorPosition(this.getPosition2D()))
        }
        this.carries.worldMgr.sceneManager.scene.add(this.carries.group)
        this.carries = null
    }

    pickupItem(item: CollectableEntity) {
        this.carries = item
        if (this.carryJoint) this.carryJoint.add(this.carries.group)
        this.carries.group.position.set(0, 0, 0)
    }

    setJob(job: Job, followUpJob: Job = null) {
        if (this.job !== job) this.stopJob()
        this.job = job
        if (this.job) this.job.assign(this)
        this.followUpJob = followUpJob
        if (this.followUpJob) this.followUpJob.assign(this)
        this.jobWorkplaces = this.job.getWorkplaces()
    }

    stopJob() {
        this.dropItem()
        if (!this.job) return
        this.job.unassign(this)
        if (this.followUpJob) this.followUpJob.unassign(this)
        this.job = null
        this.followUpJob = null
        this.jobWorkplaces = []
        this.changeActivity()
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
