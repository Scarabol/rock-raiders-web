import { EventBus } from '../event/EventBus';
import { JobCreateEvent, JobDeleteEvent } from '../event/WorldEvents';
import { Job } from './model/job/Job';
import { GameState } from './model/GameState';
import { Vector3 } from 'three';
import { Raider } from '../scene/model/Raider';
import { WorldManager } from '../scene/WorldManager';

export class Supervisor {

    worldMgr: WorldManager;
    availableJobs: Job[] = [];
    interval = null;

    constructor(worldMgr: WorldManager) {
        this.worldMgr = worldMgr;
        EventBus.registerEventListener(JobCreateEvent.eventKey, (event: JobCreateEvent) => {
            this.availableJobs.push(event.job);
        });
        EventBus.registerEventListener(JobDeleteEvent.eventKey, (event: JobDeleteEvent) => {
            const index = this.availableJobs.indexOf(event.job);
            if (index > -1) {
                event.job.cancel();
                this.availableJobs.splice(index, 1);
            }
        });
    }

    start() {
        stop();
        this.interval = setInterval(this.scheduleJobs.bind(this), 1000); // TODO externalize constant
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    scheduleJobs() {
        // console.log('Scheduling jobs; available: ' + this.availableJobs.length);
        if (this.availableJobs.length < 1) return;
        const stillAvailable = [];
        this.availableJobs.forEach((job) => { // TODO sort jobs by priority
            // find closest, qualified, unemployed raider
            let closestRaider: Raider = null;
            let minDistance = null;
            GameState.raiders.forEach((raider) => {
                if (!raider.job && job.isQualified(raider)) {
                    const dist = new Vector3().copy(job.getPosition()).sub(raider.getPosition()).lengthSq();
                    if (minDistance === null || dist < minDistance) {
                        closestRaider = raider;
                        minDistance = dist;
                    }
                }
            });
            if (closestRaider) {
                closestRaider.job = job;
                job.assign(closestRaider);
            } else {
                stillAvailable.push(job);
            }
        });
        this.availableJobs = stillAvailable;
    }

}
