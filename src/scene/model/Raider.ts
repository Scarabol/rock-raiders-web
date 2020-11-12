import { ResourceManager } from '../../resource/ResourceManager';
import { Selectable, SelectionType } from '../../game/model/Selectable';
import { EventBus } from '../../event/EventBus';
import { RaiderSelected } from '../../event/WorldEvents';
import { MovableEntity } from '../../game/model/entity/MovableEntity';
import { CollectJob, Job, JobType, SurfaceJob, SurfaceJobType } from '../../game/model/job/Job';
import { Vector3 } from 'three';
import { getRandom, getRandomSign } from '../../core/Util';
import { Collectable } from './Collectable';
import { GameState } from '../../game/model/GameState';

export class Raider extends MovableEntity implements Selectable {

    selected: boolean;
    workInterval = null;
    moveInterval = null;
    job: Job = null;
    activity: RaiderActivity = null;
    jobSubPos: Vector3 = null;
    tools: string[] = ['drill', 'shovel'];
    skills: string[] = [];
    carries: Collectable = null;
    carryTarget: Vector3 = null;

    constructor() {
        super(ResourceManager.getAnimationEntityType('mini-figures/pilot/pilot.ae'), 1.0); // TODO read speed (and other stats) from cfg
        this.group.userData = {'selectable': this};
        // TODO do not use interval, make work trigger itself (with timeout/interval) until work is done
        this.workInterval = setInterval(this.work.bind(this), 1000 / 30 / 2); // update with twice the frame rate // TODO externalize framerate
    }

    work() {
        if (!this.job) return;
        if (this.job.type === JobType.SURFACE) {
            const surfaceJobType = (this.job as SurfaceJob).workType;
            switch (surfaceJobType) {
                case SurfaceJobType.DRILL: {
                    if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                        this.moveToTarget(this.job.getPosition());
                    } else {
                        this.changeActivity(RaiderActivity.DRILLING, () => { // TODO use drilling times from cfg
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
                            this.changeActivity(RaiderActivity.SHOVELING, () => {
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
                    this.changeActivity(RaiderActivity.PICKING, () => {
                        this.pickupItem(carryJob.item);
                    });
                }
            } else if (!this.carryTarget) {
                // TODO sleep 5 seconds, before retry
                this.carryTarget = this.tryFindCarryTarget();
            } else if (this.getPosition().sub(this.carryTarget).lengthSq() > 5 * 5) { // TODO externalize constant (drop range)
                this.moveToTarget(this.carryTarget);
            } else {
                this.changeActivity(RaiderActivity.PICKING, () => {
                    this.dropItem();
                    this.job.onJobComplete();
                    this.stopJob();
                });
            }
        }
    }

    moveToTarget(target: Vector3) {
        // TODO adjust speed to possible rubble on the floor
        target.y = this.worldMgr.getTerrainHeight(target.x, target.z);
        this.changeActivity(RaiderActivity.MOVING);
        const step = new Vector3().copy(target).sub(this.getPosition());
        if (step.length() > this.getSpeed()) step.setLength(this.getSpeed());
        this.group.position.add(step);
        this.group.position.y = this.worldMgr.getTerrainHeight(this.group.position.x, this.group.position.z);
        this.group.lookAt(new Vector3(target.x, this.group.position.y, target.z));
    }

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

    pickupItem(item: Collectable) {
        this.carries = item;
        this.group.add(this.carries.getGroup());
        this.carries.getGroup().position.set(0, 7, 4); // TODO use carry joint offset
    }

    setJob(job: Job) {
        if (this.job !== job) this.stopJob();
        this.job = job;
    }

    stopJob() {
        if (!this.job) return;
        this.job.unassign(this);
        this.jobSubPos = null;
        this.carryTarget = null;
        this.job = null;
        this.changeActivity(RaiderActivity.STANDING);
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
        }
    }

    getSpeed(): number {
        let speed = super.getSpeed();
        if (this.animation && !isNaN(this.animation.transcoef)) speed *= this.animation.transcoef;
        // TODO check if raider is on path
        return speed;
    }

    changeActivity(activity: RaiderActivity, onChangeDone = null) {
        if (onChangeDone) onChangeDone.bind(this);
        if (this.activity !== activity) {
            this.activity = activity;
            switch (this.activity) {
                case RaiderActivity.STANDING:
                    this.setActivity('Stand', onChangeDone);
                    break;
                case RaiderActivity.MOVING:
                    if (this.carries) {
                        // TODO check floor (rubble?)
                        this.setActivity('Carry', onChangeDone);
                    } else {
                        // TODO check floor (rubble?)
                        this.setActivity('Run', onChangeDone);
                    }
                    break;
                case RaiderActivity.DRILLING:
                    // TODO adapt drilling time to material hardness
                    this.setActivity('Drill', onChangeDone);
                    break;
                case RaiderActivity.SHOVELING:
                    this.setActivity('ClearRubble', onChangeDone);
                    break;
                case RaiderActivity.PICKING:
                    this.setActivity('Pickup', onChangeDone);
                    break;
            }
            this.animation.looping = true; // make all looping?
        }
    }
}

enum RaiderActivity {

    STANDING,
    MOVING,
    DRILLING,
    SHOVELING,
    PICKING,

}
