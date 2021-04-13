import { MovableEntity } from './MovableEntity'
import { Selectable, SelectionType } from '../../game/model/Selectable'
import { ResourceManager } from '../../resource/ResourceManager'
import { Job, JobType } from '../../game/model/job/Job'
import { MathUtils, Vector3 } from 'three'
import { JOB_ACTION_RANGE, NATIVE_FRAMERATE } from '../../main'
import { getRandom, getRandomSign } from '../../core/Util'
import { Carryable } from './collect/Carryable'
import { DynamiteJob, SurfaceJob, SurfaceJobType } from '../../game/model/job/SurfaceJob'
import { SurfaceType } from './map/SurfaceType'
import { Crystal } from './collect/Crystal'
import { Ore } from './collect/Ore'
import { EventBus } from '../../event/EventBus'
import { CrystalFoundEvent } from '../../event/WorldLocationEvent'
import { OreFoundEvent, RaiderTrained } from '../../event/WorldEvents'
import { SelectionEvent } from '../../event/LocalEvents'
import { CollectJob } from '../../game/model/job/CollectJob'
import { TrainJob } from '../../game/model/job/TrainJob'
import { GetToolJob } from '../../game/model/job/GetToolJob'
import degToRad = MathUtils.degToRad

export abstract class FulfillerEntity extends MovableEntity implements Selectable {

    selectionType: SelectionType
    selected: boolean
    workInterval = null
    job: Job = null
    followUpJob: Job = null
    activity: FulfillerActivity = null
    jobSubPos: Vector3 = null
    tools: string[] = []
    skills: string[] = []
    carries: Carryable = null // TODO implement multi carry for vehicles
    carryTarget: Vector3 = null

    protected constructor(selectionType: SelectionType, aeFilename: string) {
        super(ResourceManager.getAnimationEntityType(aeFilename))
        this.selectionType = selectionType
        this.group.userData = {'selectable': this}
        this.workInterval = setInterval(this.work.bind(this), 1000 / NATIVE_FRAMERATE) // TODO do not use interval, make work trigger itself (with timeout/interval) until work is done
    }

    resetWorkInterval() {
        if (!this.workInterval) return
        clearInterval(this.workInterval)
        this.workInterval = null
    }

    work() {
        if (!this.job || this.selected) return
        if (this.job.type === JobType.SURFACE) {
            const surfJob = this.job as SurfaceJob
            const surfaceJobType = surfJob.workType
            if (surfaceJobType === SurfaceJobType.DRILL) {
                if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                    this.moveToTarget(this.job.getPosition())
                } else {
                    this.changeActivity(FulfillerActivity.DRILLING, () => { // TODO use drilling times from cfg
                        if (surfJob.surface.seamLevel > 0) {
                            surfJob.surface.seamLevel--
                            const vec = new Vector3().copy(this.getPosition()).sub(surfJob.surface.getCenterWorld())
                                .multiplyScalar(0.3 + getRandom(3) / 10)
                                .applyAxisAngle(new Vector3(0, 1, 0), degToRad(-10 + getRandom(20)))
                                .add(this.getPosition()) // TODO set y to terrain height at this position?
                            if (surfJob.surface.surfaceType === SurfaceType.CRYSTAL_SEAM) {
                                this.worldMgr.addCollectable(new Crystal(), vec.x, vec.z)
                                EventBus.publishEvent(new CrystalFoundEvent(vec))
                            } else if (surfJob.surface.surfaceType === SurfaceType.ORE_SEAM) {
                                this.worldMgr.addCollectable(new Ore(), vec.x, vec.z)
                                EventBus.publishEvent(new OreFoundEvent())
                            }
                            this.changeActivity(FulfillerActivity.STANDING)
                        } else {
                            this.completeJob()
                        }
                    })
                }
            } else if (surfaceJobType === SurfaceJobType.CLEAR_RUBBLE) {
                if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                    this.moveToTarget(this.job.getPosition())
                } else {
                    if (!this.jobSubPos) {
                        const jobPos = this.job.getPosition()
                        this.jobSubPos = new Vector3(jobPos.x + getRandomSign() * getRandom(10), 0, jobPos.z + getRandomSign() * getRandom(10))
                        this.jobSubPos.y = this.worldMgr.getTerrainHeight(this.jobSubPos.x, this.jobSubPos.z)
                    }
                    if (this.jobSubPos.distanceTo(this.getPosition()) > this.getSpeed()) {
                        this.moveToTarget(this.jobSubPos)
                    } else {
                        this.changeActivity(FulfillerActivity.SHOVELING, () => {
                            this.job.onJobComplete()
                            if (surfJob.surface.hasRubble()) {
                                this.jobSubPos = null
                            } else {
                                this.stopJob()
                            }
                        })
                    }
                }
            } else if (surfaceJobType === SurfaceJobType.REINFORCE) {
                if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                    this.moveToTarget(this.job.getPosition())
                } else {
                    this.changeActivity(FulfillerActivity.REINFORCE, () => {
                        this.completeJob()
                    }, 3)
                }
            } else if (surfaceJobType === SurfaceJobType.BLOW) {
                const bj = this.job as DynamiteJob
                if (this.carries !== bj.dynamite) {
                    this.dropItem()
                    if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                        this.moveToTarget(this.job.getPosition())
                    } else {
                        this.changeActivity(FulfillerActivity.PICKING, () => {
                            this.pickupItem(bj.dynamite)
                        })
                    }
                } else if (!this.carryTarget) {
                    this.carryTarget = bj.surface.getDigPositions()[0]
                } else if (this.getPosition().distanceTo(this.carryTarget) > JOB_ACTION_RANGE) {
                    this.moveToTarget(this.carryTarget)
                } else {
                    this.changeActivity(FulfillerActivity.DROPPING, () => {
                        this.dropItem()
                        this.completeJob()
                    })
                }
            }
        } else if (this.job.type === JobType.CARRY) {
            const carryJob = this.job as CollectJob
            if (this.carries !== carryJob.item) {
                this.dropItem()
                if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                    this.moveToTarget(this.job.getPosition())
                } else {
                    this.changeActivity(FulfillerActivity.PICKING, () => {
                        this.pickupItem(carryJob.item)
                    })
                }
            } else if (!this.carryTarget) {
                this.carryTarget = this.carries.getTargetPos() // TODO sleep 5 seconds, before retry
                // TODO better stop job if no carry target can be found?
            } else if (this.getPosition().distanceTo(this.carryTarget) > JOB_ACTION_RANGE) {
                this.moveToTarget(this.carryTarget)
            } else {
                this.changeActivity(FulfillerActivity.DROPPING, () => {
                    this.dropItem()
                    this.completeJob()
                })
            }
        } else if (this.job.type === JobType.MOVE) {
            if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                this.moveToTarget(this.job.getPosition())
            } else {
                this.changeActivity(FulfillerActivity.STANDING, () => {
                    this.completeJob()
                })
            }
        } else if (this.job.type === JobType.TRAIN) {
            if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                this.moveToTarget(this.job.getPosition())
            } else {
                const trainJob = this.job as TrainJob
                this.changeActivity(FulfillerActivity.TRAINING, () => { // TODO change to time based training instead of animation length
                    this.skills.push(trainJob.skill)
                    EventBus.publishEvent(new RaiderTrained(this, trainJob.skill))
                    this.completeJob()
                })
            }
        } else if (this.job.type === JobType.GET_TOOL) {
            if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                this.moveToTarget(this.job.getPosition())
            } else {
                this.tools.push((this.job as GetToolJob).tool)
                this.completeJob()
            }
        } else if (this.job.type === JobType.EAT) {
            this.changeActivity(FulfillerActivity.EATING, () => {
                // TODO implement endurance fill eat level
                this.completeJob()
            })
        }
    }

    moveToTarget(target): boolean {
        const result = super.moveToTarget(target)
        if (!result) {
            console.log('Entity could not move to job target, stopping job')
            this.stopJob() // TODO what about other targets for the same purpose that may be reachable?
        }
        return result
    }

    dropItem() {
        if (!this.carries) return
        if (this.carryJoint) this.carryJoint.remove(this.carries.group)
        this.carries.group.position.copy(this.group.position)
        this.carries = null
        this.carryTarget = null
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

    private completeJob() {
        this.job.onJobComplete()
        this.job.unassign(this)
        this.jobSubPos = null
        this.carryTarget = null
        this.job = this.followUpJob
        this.followUpJob = null
        this.changeActivity(FulfillerActivity.STANDING)
    }

    stopJob() {
        if (!this.job) return
        this.job.unassign(this)
        if (this.followUpJob) this.followUpJob.unassign(this)
        this.jobSubPos = null
        this.carryTarget = null
        this.job = null
        this.followUpJob = null
        this.changeActivity(FulfillerActivity.STANDING)
    }

    hasTool(toolname: string) {
        return this.tools.indexOf(toolname) !== -1
    }

    hasSkill(skillKey: string) {
        return this.skills.indexOf(skillKey) !== -1
    }

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

export class FulfillerActivity {

    static STANDING = new FulfillerActivity('Stand', 'StandCarry')
    static MOVING = new FulfillerActivity('Run', 'Carry')
    static MOVING_RUBBLE = new FulfillerActivity('Routerubble', 'Carryrubble')
    static DRILLING = new FulfillerActivity('Drill')
    static SHOVELING = new FulfillerActivity('ClearRubble')
    static PICKING = new FulfillerActivity('Pickup')
    static DROPPING = new FulfillerActivity('Place')
    static REINFORCE = new FulfillerActivity('Reinforce')
    static TRAINING = new FulfillerActivity('train')
    static EATING = new FulfillerActivity('eat')

    value: string
    carryValue: string

    constructor(value: string, carryValue: string = null) {
        this.value = value
        this.carryValue = carryValue
    }

    getValue(carries: boolean) {
        return carries ? (this.carryValue || this.value) : this.value
    }

}
