import { EventBus } from '../event/EventBus'
import { JobCreateEvent, JobDeleteEvent } from '../event/WorldEvents'
import { Job, JobState, PublicJob } from './model/job/Job'
import { GameState } from './model/GameState'
import { Vector3 } from 'three'
import { Raider } from '../scene/model/Raider'
import { WorldManager } from '../scene/WorldManager'
import { JOB_SCHEDULE_INTERVAL } from '../main'

export class Supervisor {

    worldMgr: WorldManager
    jobs: PublicJob[] = []
    interval = null

    constructor(worldMgr: WorldManager) {
        this.worldMgr = worldMgr
        EventBus.registerEventListener(JobCreateEvent.eventKey, (event: JobCreateEvent) => {
            this.jobs.push(event.job)
        })
        EventBus.registerEventListener(JobDeleteEvent.eventKey, (event: JobDeleteEvent) => {
            event.job.cancel()
        })
    }

    start() {
        stop()
        this.interval = setInterval(this.scheduleJobs.bind(this), JOB_SCHEDULE_INTERVAL)
    }

    stop() {
        if (this.interval) clearInterval(this.interval)
        this.interval = null
        GameState.raiders.forEach((r) => r.resetWorkInterval())
        GameState.raidersUndiscovered.forEach((r) => r.resetWorkInterval())
        GameState.vehicles.forEach((v) => v.resetWorkInterval())
        GameState.vehiclesUndiscovered.forEach((v) => v.resetWorkInterval())
    }

    scheduleJobs() {
        this.jobs = this.jobs.filter((j) => j.jobstate === JobState.OPEN)
        this.jobs.sort((left, right) => {
            return Math.sign(GameState.priorityList.getPriority(left) - GameState.priorityList.getPriority(right))
        })
        this.jobs.forEach((job) => {
            if (job.fulfiller.length > 0) return
            const closestRaider = this.findClosestPossibleRaider(job)
            if (closestRaider) closestRaider.setJob(job)
        })
        // TODO find unemployed raider and check if the can be trained or take tools
    }

    private findClosestPossibleRaider(job: Job) {
        let closestRaider: Raider = null
        let minDistance = null
        GameState.raiders.forEach((raider) => {
            if (!raider.job && job.isQualified(raider)) {
                const dist = new Vector3().copy(job.getPosition()).sub(raider.getPosition()).lengthSq()
                if (minDistance === null || dist < minDistance) {
                    closestRaider = raider
                    minDistance = dist
                }
            }
        })
        return closestRaider
    }
}
