import { Vector2, Vector3 } from 'three'
import { MovableEntityStats } from '../../cfg/MovableEntityStats'
import { clearIntervalSafe } from '../../core/Util'
import { SelectionEvent } from '../../event/LocalEvents'
import { NATIVE_FRAMERATE } from '../../params'
import { SceneManager } from '../SceneManager'
import { WorldManager } from '../WorldManager'
import { MaterialEntity } from './collect/MaterialEntity'
import { EntitySuperType, EntityType } from './EntityType'
import { Job } from './job/Job'
import { MovableEntity } from './MovableEntity'
import { PathTarget } from './PathTarget'
import { RaiderTool } from './raider/RaiderTool'
import { RaiderTraining } from './raider/RaiderTraining'
import { Selectable, SelectionType } from './Selectable'

export abstract class FulfillerEntity extends MovableEntity implements Selectable {

    selectionType: SelectionType
    selected: boolean
    workInterval = null
    job: Job = null
    followUpJob: Job = null
    carries: MaterialEntity = null
    jobWorkplaces: PathTarget[] = []

    protected constructor(worldMgr: WorldManager, sceneMgr: SceneManager, superType: EntitySuperType, entityType: EntityType, aeFilename: string, selectionType: SelectionType) {
        super(worldMgr, sceneMgr, superType, entityType, aeFilename)
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
        const position = this.getPosition()
        if (this.carryJoint) {
            this.carryJoint.remove(this.carries.group)
            this.carryJoint.getWorldPosition(position)
        }
        this.carries.addToScene(new Vector2(position.x, position.z), null)
        this.carries = null
    }

    pickupItem(item: MaterialEntity) {
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

    abstract hasTraining(training: RaiderTraining)

    getSelectionType(): SelectionType {
        return this.selectionType
    }

    deselect() {
        this.selectionFrame.visible = false
        this.selected = false
    }

    abstract select(): SelectionEvent;

    abstract getSelectionCenter(): Vector3;

    abstract addTool(tool: RaiderTool)

    abstract addTraining(skill: RaiderTraining)

    abstract get stats(): FulfillerStats

}

export class FulfillerStats extends MovableEntityStats {

    HardDrillTime: number[]
    LooseDrillTime: number[]
    SoilDrillTime: number[]
    SeamDrillTime: number[]

}
