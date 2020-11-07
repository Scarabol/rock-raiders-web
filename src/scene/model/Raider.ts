import { ResourceManager } from '../../resource/ResourceManager';
import { Selectable, SelectionType } from '../../game/model/Selectable';
import { EventBus } from '../../event/EventBus';
import { RaiderDeselected, RaiderSelected } from '../../event/WorldEvents';
import { MovableEntity } from '../../game/model/entity/MovableEntity';
import { Job, JobType, SurfaceJob } from '../../game/model/job/Job';
import { Vector3 } from 'three';

export class Raider extends MovableEntity implements Selectable {

    selected: boolean;
    workInterval = null;
    moveInterval = null;
    job: Job = null;
    state: RaiderState = null;

    constructor() {
        super(ResourceManager.getAnimationEntityType('mini-figures/pilot/pilot.ae'), 1); // FIXME read speed (and other stats) from cfg
        this.group.userData = {'selectable': this};
        this.workInterval = setInterval(this.work.bind(this), 1000 / 30 / 2); // update with twice the frame rate // TODO externalize framerate
    }

    work() {
        if (!this.job) return;
        if (this.job.type === JobType.DRILL) {
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
                        raider.state = RaiderState.STANDING;
                        raider.setActivity('Stand');
                        const surfJob = raider.job as SurfaceJob;
                        surfJob.surface.collapse();
                        raider.job = null; // TODO mark job as done? also notify others working on the job
                    }, 1500);
                }
            }
        } else {
            console.warn('Job type not yet implemented: ' + this.job.type);
        }
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

}
