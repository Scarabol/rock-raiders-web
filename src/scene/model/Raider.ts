import { ResourceManager } from '../../resource/ResourceManager';
import { Selectable, SelectionType } from '../../game/model/Selectable';
import { EventBus } from '../../event/EventBus';
import { RaiderDeselected, RaiderSelected } from '../../event/WorldEvents';
import { MovableEntity } from '../../game/model/entity/MovableEntity';
import { Job, JobType, SurfaceJob, SurfaceJobType } from '../../game/model/job/Job';
import { Vector3 } from 'three';
import { getRandomSign } from '../../core/Util';

export class Raider extends MovableEntity implements Selectable {

    selected: boolean;
    workInterval = null;
    moveInterval = null;
    job: Job = null;
    state: RaiderState = null;
    jobSubPos: Vector3 = null;
    tools: string[] = ['drill'];
    skills: string[] = [];

    constructor() {
        super(ResourceManager.getAnimationEntityType('mini-figures/pilot/pilot.ae'), 0.8); // FIXME read speed (and other stats) from cfg
        this.group.userData = {'selectable': this};
        this.workInterval = setInterval(this.work.bind(this), 1000 / 30 / 2); // update with twice the frame rate // TODO externalize framerate
    }

    work() {
        if (!this.job) return;
        if (this.job.type === JobType.SURFACE) {
            const surfaceJobType = (this.job as SurfaceJob).workType;
            switch (surfaceJobType) {
                case SurfaceJobType.DRILL: {
                    const jobPos = this.job.getPosition();
                    jobPos.y = this.worldMgr.getTerrainHeight(jobPos.x, jobPos.z);
                    const distance = new Vector3().copy(jobPos).sub(this.getPosition());
                    if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                        if (this.state !== RaiderState.WALKING && this.state !== RaiderState.RUNING) {
                            this.state = RaiderState.RUNING;
                            this.setActivity('Run');
                            this.animation.looping = true; // TODO add option to move exactly one animation length?
                        }
                        if (distance.length() > this.getSpeed()) distance.setLength(this.getSpeed());
                        this.group.position.add(distance);
                        this.group.position.y = this.worldMgr.getTerrainHeight(this.group.position.x, this.group.position.z);
                        this.group.lookAt(new Vector3(jobPos.x, this.group.position.y, jobPos.z));
                    } else {
                        if (this.state !== RaiderState.DRILLING) {
                            this.state = RaiderState.DRILLING;
                            this.setActivity('Drill');
                            this.animation.looping = true; // TODO reduce to one drill step? or make everything looping?
                            const raider = this;
                            setTimeout(() => {
                                raider.job.onJobComplete();
                                raider.stopJob();
                            }, 1500);
                        }
                    }
                }
                    break;
                case SurfaceJobType.CLEAR_RUBBLE: {
                    const jobPos = this.job.getPosition();
                    jobPos.y = this.worldMgr.getTerrainHeight(jobPos.x, jobPos.z);
                    const distance = new Vector3().copy(jobPos).sub(this.getPosition());
                    if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                        if (this.state !== RaiderState.WALKING && this.state !== RaiderState.RUNING) {
                            this.state = RaiderState.RUNING;
                            this.setActivity('Run');
                            this.animation.looping = true; // TODO add option to move exactly one animation length?
                        }
                        if (distance.length() > this.getSpeed()) distance.setLength(this.getSpeed());
                        this.group.position.add(distance);
                        this.group.position.y = this.worldMgr.getTerrainHeight(this.group.position.x, this.group.position.z);
                        this.group.lookAt(new Vector3(jobPos.x, this.group.position.y, jobPos.z));
                    } else {
                        if (!this.jobSubPos) {
                            this.jobSubPos = new Vector3(jobPos.x + getRandomSign() * 10, 0, jobPos.z + getRandomSign() * 10);
                            this.jobSubPos.y = this.worldMgr.getTerrainHeight(this.jobSubPos.x, this.jobSubPos.z);
                        }
                        const distance = new Vector3().copy(this.jobSubPos).sub(this.getPosition());
                        if (distance.length() > this.getSpeed()) {
                            if (this.state !== RaiderState.WALKING && this.state !== RaiderState.RUNING) {
                                this.state = RaiderState.RUNING;
                                this.setActivity('Run');
                                this.animation.looping = true; // TODO add option to move exactly one animation length?
                            }
                            if (distance.length() > this.getSpeed()) distance.setLength(this.getSpeed());
                            this.group.position.add(distance);
                            this.group.position.y = this.worldMgr.getTerrainHeight(this.group.position.x, this.group.position.z);
                            this.group.lookAt(new Vector3(this.jobSubPos.x, this.group.position.y, this.jobSubPos.z));
                        } else if (this.state !== RaiderState.SHOVELING) {
                            this.state = RaiderState.SHOVELING;
                            this.setActivity('ClearRubble');
                            this.animation.looping = true; // TODO reduce to one shovel step? or make everything looping?
                            const raider = this;
                            setTimeout(() => {
                                raider.job.onJobComplete();
                                raider.stopJob();
                            }, 2000);
                        }
                    }
                }
                    break;
                default:
                    // console.warn('Job type not yet implemented: ' + this.job.type); // LEADS TO SPAM!
                    break;
            }
        }
    }

    setJob(job: Job) {
        if (this.job !== job) this.stopJob();
        this.job = job;
    }

    stopJob() {
        if (!this.job) return;
        this.job.unassign(this);
        this.jobSubPos = null;
        this.job = null;
        this.state = RaiderState.STANDING;
        this.setActivity('Stand');
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
        return SelectionType.PILOT;
    }

    select(): Selectable {
        if (!this.selected) {
            this.selected = true;
            this.selectionFrame.visible = true;
            // TODO stop any movement/job execution
            EventBus.publishEvent(new RaiderSelected(this));
        }
        return this;
    }

    deselect() {
        if (this.selected) {
            this.selected = false;
            this.selectionFrame.visible = false;
            EventBus.publishEvent(new RaiderDeselected(this));
        }
    }

}

enum RaiderState { // TODO same as animationState?

    STANDING,
    WALKING,
    RUNING,
    DRILLING,
    SHOVELING,

}
