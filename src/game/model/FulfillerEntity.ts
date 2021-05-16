import { Vector2, Vector3 } from 'three'
import { clearIntervalSafe } from '../../core/Util'
import { NATIVE_FRAMERATE } from '../../params'
import { SceneManager } from '../SceneManager'
import { WorldManager } from '../WorldManager'
import { MaterialEntity } from './collect/MaterialEntity'
import { EntitySuperType, EntityType } from './EntityType'
import { Job } from './job/Job'
import { MovableEntity } from './MovableEntity'
import { RaiderTool } from './raider/RaiderTool'
import { RaiderTraining } from './raider/RaiderTraining'
import { Selectable, SelectionType } from './Selectable'

export abstract class FulfillerEntity extends MovableEntity implements Selectable {

    selected: boolean
    workInterval = null
    job: Job = null
    followUpJob: Job = null
    carries: MaterialEntity = null
    inBeam: boolean = false

    protected constructor(worldMgr: WorldManager, sceneMgr: SceneManager, superType: EntitySuperType, entityType: EntityType, aeFilename: string) {
        super(worldMgr, sceneMgr, superType, entityType, aeFilename)
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
    }

    stopJob() {
        this.dropItem()
        if (!this.job) return
        this.job.unassign(this)
        if (this.followUpJob) this.followUpJob.unassign(this)
        this.job = null
        this.followUpJob = null
        this.changeActivity()
    }

    abstract hasTool(tool: RaiderTool)

    abstract hasTraining(training: RaiderTraining)

    abstract getSelectionType(): SelectionType

    deselect() {
        this.selectionFrame.visible = false
        this.selected = false
    }

    select(): boolean {
        if (this.selected || this.inBeam) return false
        this.selectionFrame.visible = true
        this.selected = true
        this.changeActivity()
        return true
    }

    getSelectionCenter(): Vector3 {
        return this.pickSphere ? new Vector3().copy(this.pickSphere.position).applyMatrix4(this.group.matrixWorld) : null
    }

    abstract addTool(tool: RaiderTool)

    abstract addTraining(skill: RaiderTraining)

    abstract get stats()

    removeFromScene() {
        super.removeFromScene()
        this.workInterval = clearIntervalSafe(this.workInterval)
    }

    beamUp() {
        super.beamUp()
        this.inBeam = true
    }

}
