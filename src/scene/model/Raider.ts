import { ResourceManager } from '../../resource/ResourceManager';
import { Selectable, SelectionType } from '../../game/model/Selectable';
import { EventBus } from '../../event/EventBus';
import { RaiderDeselected, RaiderSelected } from '../../event/WorldEvents';
import { MovableEntity } from '../../game/model/entity/MovableEntity';
import { CollectJob, Job, JobType, SurfaceJob, SurfaceJobType } from '../../game/model/job/Job';
import { Vector3 } from 'three';
import { getRandom, getRandomSign } from '../../core/Util';
import { Collectable, CollectableType } from './Collectable';
import { GameState } from '../../game/model/GameState';
import { TOOLSTATION } from '../../game/model/entity/building/Building';

export class Raider extends MovableEntity implements Selectable {

    selected: boolean;
    workInterval = null;
    moveInterval = null;
    job: Job = null;
    state: RaiderState = null;
    jobSubPos: Vector3 = null;
    tools: string[] = ['drill', 'shovel'];
    skills: string[] = [];
    carries: Collectable = null;
    carryTarget: Vector3 = null;

    constructor() {
        super(ResourceManager.getAnimationEntityType('mini-figures/pilot/pilot.ae'), 0.8); // TODO read speed (and other stats) from cfg
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
                            this.jobSubPos = new Vector3(jobPos.x + getRandomSign() * getRandom(10), 0, jobPos.z + getRandomSign() * getRandom(10));
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
        } else if (this.job.type === JobType.CARRY) {
            const carryJob = this.job as CollectJob;
            if (this.carries !== carryJob.item) {
                this.dropItem();
                if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                    if (this.state !== RaiderState.WALKING && this.state !== RaiderState.RUNING) {
                        this.state = RaiderState.RUNING;
                        this.setActivity('Run');
                        this.animation.looping = true; // TODO add option to move exactly one animation length?
                    }
                    const jobPos = this.job.getPosition();
                    const distance = new Vector3().copy(jobPos).sub(this.getPosition());
                    if (distance.length() > this.getSpeed()) distance.setLength(this.getSpeed());
                    this.group.position.add(distance);
                    this.group.position.y = this.worldMgr.getTerrainHeight(this.group.position.x, this.group.position.z);
                    this.group.lookAt(new Vector3(jobPos.x, this.group.position.y, jobPos.z));
                } else {
                    this.state = RaiderState.STANDING;
                    this.setActivity('Pickup'); // TODO on complete switch to standing
                    this.pickupItem(carryJob.item);
                }
            } else if (!this.carryTarget) {
                // TODO sleep 5 seconds, before retry
                this.carryTarget = this.tryFindCarryTarget();
            } else if (this.getPosition().sub(this.carryTarget).lengthSq() > 5 * 5) { // TODO externalize constant (drop range)
                if (this.state !== RaiderState.WALKING && this.state !== RaiderState.RUNING) {
                    this.state = RaiderState.RUNING;
                    this.setActivity('Carry');
                    this.animation.looping = true; // TODO add option to move exactly one animation length?
                }
                const jobPos = this.carryTarget;
                const distance = new Vector3().copy(jobPos).sub(this.getPosition());
                if (distance.length() > this.getSpeed()) distance.setLength(this.getSpeed());
                this.group.position.add(distance);
                this.group.position.y = this.worldMgr.getTerrainHeight(this.group.position.x, this.group.position.z);
                this.group.lookAt(new Vector3(jobPos.x, this.group.position.y, jobPos.z));
            } else if (this.state !== RaiderState.STANDING) { // TODO find better condition?
                this.state = RaiderState.STANDING;
                this.setActivity('Deposit');
                this.dropItem();
                const raider = this;
                setTimeout(() => {
                    raider.job.onJobComplete();
                    raider.stopJob();
                }, 1000);
            }
        }
    }

    tryFindCarryTarget(): Vector3 {
        const carryType = this.carries.getCollectableType();
        if (carryType === CollectableType.CRYSTAL) {
            const targetBuildings = GameState.getBuildingsByType(TOOLSTATION); // TODO look for power station preferrably
            let closest = null, minDist = null;
            targetBuildings.forEach((b) => {
                const bPos = b.getDropPosition();
                const dist = this.getPosition().sub(bPos).lengthSq();
                if (closest === null || dist < minDist) {
                    closest = bPos;
                    minDist = dist;
                }
            });
            return closest;
        } else if (carryType === CollectableType.ORE) {
            const targetBuildings = GameState.getBuildingsByType(TOOLSTATION); // TODO look for refinery preferrably
            let closest = null, minDist = null;
            targetBuildings.forEach((b) => {
                const bPos = b.getDropPosition();
                const dist = this.getPosition().sub(bPos).lengthSq();
                if (closest === null || dist < minDist) {
                    closest = bPos;
                    minDist = dist;
                }
            });
            return closest;
        } // TODO implement other types
        return null;
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
        this.carryTarget = null; // TODO also drop item?
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
