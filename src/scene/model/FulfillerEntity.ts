import { MovableEntity } from './MovableEntity';
import { Selectable, SelectionType } from '../../game/model/Selectable';
import { ResourceManager } from '../../resource/ResourceManager';
import { CollectJob, Job, JobType } from '../../game/model/job/Job';
import { MathUtils, Vector3 } from 'three';
import { JOB_ACTION_RANGE, NATIVE_FRAMERATE } from '../../main';
import { getRandom, getRandomSign } from '../../core/Util';
import { Carryable } from './collect/Carryable';
import { DynamiteJob, SurfaceJob, SurfaceJobType } from '../../game/model/job/SurfaceJob';
import { SurfaceType } from './map/SurfaceType';
import { Crystal } from './collect/Crystal';
import { Ore } from './collect/Ore';
import degToRad = MathUtils.degToRad;

export abstract class FulfillerEntity extends MovableEntity implements Selectable {

    selectionType: SelectionType;
    selected: boolean;
    workInterval = null;
    job: Job = null;
    activity: FulfillerActivity = null;
    jobSubPos: Vector3 = null;
    tools: string[] = [];
    skills: string[] = [];
    carries: Carryable = null; // TODO implement multi carry for vehicles
    carryTarget: Vector3 = null;

    protected constructor(selectionType: SelectionType, aeFilename: string, speed: number) {
        super(ResourceManager.getAnimationEntityType(aeFilename), speed);
        this.selectionType = selectionType;
        this.group.userData = {'selectable': this};
        this.workInterval = setInterval(this.work.bind(this), 1000 / NATIVE_FRAMERATE); // TODO do not use interval, make work trigger itself (with timeout/interval) until work is done
    }

    work() {
        if (!this.job || this.selected) return;
        if (this.job.type === JobType.SURFACE) {
            const surfJob = this.job as SurfaceJob;
            const surfaceJobType = surfJob.workType;
            if (surfaceJobType === SurfaceJobType.DRILL) {
                if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                    this.moveToTarget(this.job.getPosition());
                } else {
                    this.changeActivity(FulfillerActivity.DRILLING, () => { // TODO use drilling times from cfg
                        if (surfJob.surface.seamLevel > 0) {
                            surfJob.surface.seamLevel--;
                            const vec = new Vector3().copy(this.getPosition()).sub(surfJob.surface.getCenterWorld())
                                .multiplyScalar(0.3 + getRandom(3) / 10)
                                .applyAxisAngle(new Vector3(0, 1, 0), degToRad(-10 + getRandom(20)))
                                .add(this.getPosition());
                            if (surfJob.surface.surfaceType === SurfaceType.CRYSTAL_SEAM) {
                                this.worldMgr.addCollectable(new Crystal(), vec.x, vec.z);
                            } else if (surfJob.surface.surfaceType === SurfaceType.ORE_SEAM) {
                                this.worldMgr.addCollectable(new Ore(), vec.x, vec.z);
                            }
                            this.changeActivity(FulfillerActivity.STANDING);
                        } else {
                            this.job.onJobComplete();
                            this.stopJob();
                        }
                    });
                }
            } else if (surfaceJobType === SurfaceJobType.CLEAR_RUBBLE) {
                if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                    this.moveToTarget(this.job.getPosition());
                } else {
                    if (!this.jobSubPos) {
                        const jobPos = this.job.getPosition();
                        this.jobSubPos = new Vector3(jobPos.x + getRandomSign() * getRandom(10), 0, jobPos.z + getRandomSign() * getRandom(10));
                        this.jobSubPos.y = this.worldMgr.getTerrainHeight(this.jobSubPos.x, this.jobSubPos.z);
                    }
                    if (new Vector3().copy(this.jobSubPos).sub(this.getPosition()).length() > this.getSpeed()) {
                        this.moveToTarget(this.jobSubPos);
                    } else {
                        this.changeActivity(FulfillerActivity.SHOVELING, () => {
                            this.job.onJobComplete();
                            if (surfJob.surface.hasRubble()) {
                                this.jobSubPos = null;
                            } else {
                                this.stopJob();
                            }
                        });
                    }
                }
            } else if (surfaceJobType === SurfaceJobType.REINFORCE) {
                if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                    this.moveToTarget(this.job.getPosition());
                } else {
                    this.changeActivity(FulfillerActivity.REINFORCE, () => {
                        this.job.onJobComplete();
                        this.stopJob();
                    }, 3);
                }
            } else if (surfaceJobType === SurfaceJobType.BLOW) {
                const bj = this.job as DynamiteJob;
                if (this.carries !== bj.dynamite) {
                    this.dropItem();
                    if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                        this.moveToTarget(this.job.getPosition());
                    } else {
                        this.changeActivity(FulfillerActivity.PICKING, () => {
                            this.pickupItem(bj.dynamite);
                        });
                    }
                } else if (!this.carryTarget) {
                    this.carryTarget = bj.surface.getDigPositions()[0];
                } else if (this.getPosition().sub(this.carryTarget).length() > JOB_ACTION_RANGE) {
                    this.moveToTarget(this.carryTarget);
                } else {
                    this.changeActivity(FulfillerActivity.DROPPING, () => {
                        this.dropItem();
                        this.job.onJobComplete();
                        this.stopJob();
                    });
                }
            }
        } else if (this.job.type === JobType.CARRY) {
            const carryJob = this.job as CollectJob;
            if (this.carries !== carryJob.item) {
                this.dropItem();
                if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                    this.moveToTarget(this.job.getPosition());
                } else {
                    this.changeActivity(FulfillerActivity.PICKING, () => {
                        this.pickupItem(carryJob.item);
                    });
                }
            } else if (!this.carryTarget) {
                this.carryTarget = this.carries.getTargetPos(); // TODO sleep 5 seconds, before retry
            } else if (this.getPosition().sub(this.carryTarget).length() > JOB_ACTION_RANGE) {
                this.moveToTarget(this.carryTarget);
            } else {
                this.changeActivity(FulfillerActivity.DROPPING, () => {
                    this.dropItem();
                    this.job.onJobComplete();
                    this.stopJob();
                });
            }
        } else if (this.job.type === JobType.MOVE) {
            if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                this.moveToTarget(this.job.getPosition());
            } else {
                this.changeActivity(FulfillerActivity.STANDING, () => {
                    this.job.onJobComplete();
                    this.stopJob();
                });
            }
        }
    }

    dropItem() {
        if (!this.carries) return;
        if (this.carryJoint) this.carryJoint.remove(this.carries.group);
        this.carries.group.position.copy(this.carryTarget);
        this.carries = null;
        this.carryTarget = null;
    }

    pickupItem(item: Carryable) {
        this.carries = item;
        if (this.carryJoint) this.carryJoint.add(this.carries.group);
        this.carries.group.position.set(0, 0, 0);
    }

    setJob(job: Job) {
        if (this.job !== job) this.stopJob();
        this.job = job;
        if (this.job) this.job.assign(this);
    }

    stopJob() {
        if (!this.job) return;
        this.job.unassign(this);
        this.jobSubPos = null;
        this.carryTarget = null;
        this.job = null;
        this.changeActivity(FulfillerActivity.STANDING);
    }

    hasTools(toolnames: string[]) {
        for (let c = 0; c < toolnames.length; c++) {
            if (this.tools.indexOf(toolnames[c]) === -1) return false;
        }
        return true;
    }

    hasSkills(skillKeys: string[]) {
        for (let c = 0; c < skillKeys.length; c++) {
            if (this.skills.indexOf(skillKeys[c]) === -1) return false;
        }
        return true;
    }

    getSelectionType(): SelectionType {
        return this.selectionType;
    }

    deselect() {
        this.selectionFrame.visible = false;
        this.selected = false;
    }

    select() {
        this.selectionFrame.visible = true;
        if (!this.selected) {
            this.selected = true;
            this.onSelect();
            return this;
        }
        return null;
    }

    onSelect() {
    }

    abstract getSelectionCenter(): Vector3;

}

export enum FulfillerActivity {

    STANDING,
    MOVING,
    MOVING_RUBBLE,
    DRILLING,
    SHOVELING,
    PICKING,
    DROPPING,
    REINFORCE,

}
