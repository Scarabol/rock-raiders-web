import { MovableEntity } from './MovableEntity';
import { Selectable, SelectionType } from '../../game/model/Selectable';
import { ResourceManager } from '../../resource/ResourceManager';
import { CollectJob, Job, JobType, SurfaceJob, SurfaceJobType } from '../../game/model/job/Job';
import { Vector3 } from 'three';
import { CollectableEntity } from './collect/CollectableEntity';
import { NATIVE_FRAMERATE, PICKUP_RANGE } from '../../main';
import { GameState } from '../../game/model/GameState';
import { getRandom, getRandomSign } from '../../core/Util';
import { EventBus } from '../../event/EventBus';
import { JobCreateEvent } from '../../event/WorldEvents';

export abstract class FulfillerEntity extends MovableEntity implements Selectable {

    selectionType: SelectionType;
    selected: boolean;
    workInterval = null;
    job: Job = null;
    activity: FulfillerActivity = null;
    jobSubPos: Vector3 = null;
    tools: string[] = [];
    skills: string[] = [];
    carries: CollectableEntity = null;
    carryTarget: Vector3 = null;

    constructor(selectionType: SelectionType, aeFilename: string, speed: number) {
        super(ResourceManager.getAnimationEntityType(aeFilename), speed);
        this.selectionType = selectionType;
        this.group.userData = {'selectable': this};
        this.workInterval = setInterval(this.work.bind(this), 1000 / NATIVE_FRAMERATE / GameState.gameSpeedMultiplier); // TODO do not use interval, make work trigger itself (with timeout/interval) until work is done
    }

    work() {
        if (!this.job || this.selected) return;
        if (this.job.type === JobType.SURFACE) {
            const surfaceJobType = (this.job as SurfaceJob).workType;
            switch (surfaceJobType) {
                case SurfaceJobType.DRILL: {
                    if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                        this.moveToTarget(this.job.getPosition());
                    } else {
                        this.changeActivity(FulfillerActivity.DRILLING, () => { // TODO use drilling times from cfg
                            this.job.onJobComplete();
                            this.stopJob();
                        });
                    }
                }
                    break;
                case SurfaceJobType.CLEAR_RUBBLE: {
                    if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                        this.moveToTarget(this.job.getPosition());
                    } else {
                        if (!this.jobSubPos) {
                            const jobPos = this.job.getPosition();
                            this.jobSubPos = new Vector3(jobPos.x + getRandomSign() * getRandom(10), 0, jobPos.z + getRandomSign() * getRandom(10));
                            this.jobSubPos.y = this.worldMgr.getTerrainHeight(this.jobSubPos.x, this.jobSubPos.z);
                        }
                        const distance = new Vector3().copy(this.jobSubPos).sub(this.getPosition());
                        if (distance.length() > this.getSpeed()) {
                            this.moveToTarget(this.jobSubPos);
                        } else {
                            this.changeActivity(FulfillerActivity.SHOVELING, () => {
                                this.job.onJobComplete();
                                const surfJob = this.job as SurfaceJob;
                                if (surfJob.surface.hasRubble()) {
                                    this.jobSubPos = null;
                                } else {
                                    this.stopJob();
                                }
                            });
                        }
                    }
                }
                    break;
                default:
                    // console.warn('Job type not yet implemented: ' + this.job.type); // LEADS TO SPAM!
                    break;
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
                this.carryTarget = this.tryFindCarryTarget(); // TODO sleep 5 seconds, before retry
            } else if (this.getPosition().sub(this.carryTarget).length() > PICKUP_RANGE) {
                this.moveToTarget(this.carryTarget);
            } else {
                this.changeActivity(FulfillerActivity.PICKING, () => {
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

    moveToTarget(target: Vector3) {
        target.y = this.worldMgr.getTerrainHeight(target.x, target.z);
        if (this.isOnRubble()) {
            this.changeActivity(FulfillerActivity.MOVING_RUBBLE);
        } else {
            this.changeActivity(FulfillerActivity.MOVING);
        }
        const step = new Vector3().copy(target).sub(this.getPosition());
        if (step.length() > this.getSpeed()) step.setLength(this.getSpeed());
        this.group.position.add(step);
        this.group.position.y = this.worldMgr.getTerrainHeight(this.group.position.x, this.group.position.z);
        this.group.lookAt(new Vector3(target.x, this.group.position.y, target.z));
    }

    abstract isOnRubble(): boolean;

    tryFindCarryTarget(): Vector3 {
        const targetBuilding = GameState.getClosestBuildingByType(this.getPosition(), ...this.carries.getTargetBuildingTypes());
        return targetBuilding ? targetBuilding.getDropPosition() : null;
    }

    dropItem() {
        if (!this.carries) return;
        this.group.remove(this.carries.getGroup()); // TODO remove from carry joint
        this.carries.getGroup().position.copy(this.carryTarget);
        this.carries = null;
        this.carryTarget = null;
    }

    pickupItem(item: CollectableEntity) {
        this.carries = item;
        this.group.add(this.carries.getGroup());
        this.carries.getGroup().position.set(0, 7, 4); // TODO use carry joint offset
    }

    setJob(job: Job) {
        if (this.job !== job) {
            const oldJob = this.job;
            this.stopJob();
            if (oldJob && oldJob.type === JobType.SURFACE) EventBus.publishEvent(new JobCreateEvent(oldJob));
        }
        this.job = job;
        this.job.assign(this);
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

    changeActivity(activity: FulfillerActivity, onChangeDone = null) {
    }

    getSelectionType(): SelectionType {
        return this.selectionType;
    }

    deselect() {
        if (this.selected) {
            this.selected = false;
            this.selectionFrame.visible = false;
        }
    }

    select() {
        if (!this.selected) {
            this.selected = true;
            this.selectionFrame.visible = true;
            this.onSelect();
        }
        return this;
    }

    onSelect() {
    }

}

export enum FulfillerActivity {

    STANDING,
    MOVING,
    MOVING_RUBBLE,
    DRILLING,
    SHOVELING,
    PICKING,

}
