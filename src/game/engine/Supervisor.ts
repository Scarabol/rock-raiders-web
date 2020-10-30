import { EventBus } from '../event/EventBus';
import { JobCreateEvent, JobDeleteEvent } from '../event/WorldEvents';
import { Job } from '../model/job/Job';
import { GameState } from '../model/GameState';
import { Vector3 } from 'three';
import { MoveToTarget } from '../model/job/MoveToTarget';
import { Raider } from '../model/entity/Raider';

export class Supervisor {

    availableJobs: Job[] = [];
    interval = null;

    constructor() {
        EventBus.registerEventListener(JobCreateEvent.eventKey, (event: JobCreateEvent) => {
            this.availableJobs.push(event.job);
        });
        EventBus.registerEventListener(JobDeleteEvent.eventKey, (event: JobDeleteEvent) => {
            const index = this.availableJobs.indexOf(event.job);
            if (index > -1) {
                this.availableJobs.splice(index, 5);
                // TODO remove raider from job, if taken
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
        console.log('Scheduling jobs; available: ' + this.availableJobs.length);
        if (this.availableJobs.length < 1) return;
        const stillAvailable = [];
        this.availableJobs.forEach((job) => { // TODO sort jobs by priority
            // find closest, qualified, unemployed raider
            let closestRaider: Raider = null;
            let minDistance = null;
            GameState.raiders.forEach((raider) => {
                if (raider.tasks.length < 1 && job.isQualified(raider)) {
                    const dist = new Vector3().copy(job.getPosition()).sub(raider.getPosition()).lengthSq();
                    if (minDistance === null || dist < minDistance) {
                        closestRaider = raider;
                        minDistance = dist;
                    }
                }
            });
            if (closestRaider) {
                // TODO compute what needs to be done to fulfill this task, so far just move
                closestRaider.tasks = [new MoveToTarget(closestRaider, job.getPosition())]; // so far... just move!
            } else {
                stillAvailable.push(job);
            }
        });
        this.availableJobs = stillAvailable;
    }

}
