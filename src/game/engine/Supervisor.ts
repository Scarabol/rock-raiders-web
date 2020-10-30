import { EventBus } from '../event/EventBus';
import { JobCreateEvent, JobDeleteEvent } from '../event/WorldEvents';
import { Job } from '../model/Job';

export class Supervisor {

    availableJobs: Job[] = [];
    takenJobs: Job[] = [];
    interval = null;

    constructor() {
        EventBus.registerEventListener(JobCreateEvent.eventKey, (event: JobCreateEvent) => {
            this.availableJobs.push(event.job);
        });
        EventBus.registerEventListener(JobDeleteEvent.eventKey, (event: JobDeleteEvent) => {
            const index = this.availableJobs.indexOf(event.job);
            if (index > -1) {
                this.availableJobs.splice(index, 1);
                // TODO remove raider from job, if taken
            }
        });
    }

    start() {
        stop();
        this.interval = setInterval(this.scheduleJobs, 1000); // TODO externalize constant
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    scheduleJobs() {
        // console.log('Scheduling jobs');
        // TODO look for raider and assign available jobs
    }

}
