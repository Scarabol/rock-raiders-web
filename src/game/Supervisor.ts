import { EventBus } from '../event/EventBus'
import { JobCreateEvent, JobDeleteEvent } from '../event/WorldEvents'
import { Job, JobState } from './model/job/Job'
import { GameState } from './model/GameState'
import { Vector3 } from 'three'
import { Raider } from '../scene/model/Raider'
import { WorldManager } from '../scene/WorldManager'
import { JOB_SCHEDULE_INTERVAL } from '../main'

export class Supervisor {

    worldMgr: WorldManager
    jobs: Job[] = []
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
        GameState.raiders.forEach((r) => {
            if (r.workInterval) clearInterval(r.workInterval)
            r.workInterval = null
        })
        GameState.raidersUndiscovered.forEach((r) => {
            if (r.workInterval) clearInterval(r.workInterval)
            r.workInterval = null
        })
        GameState.vehicles.forEach((v) => {
            if (v.workInterval) clearInterval(v.workInterval)
            v.workInterval = null
        })
        GameState.vehiclesUndiscovered.forEach((v) => {
            if (v.workInterval) clearInterval(v.workInterval)
            v.workInterval = null
        })
    }

    scheduleJobs() {
        this.jobs = this.jobs.filter((j) => j.jobstate === JobState.OPEN)
        this.jobs.filter((j) => j.fulfiller.length < 1).forEach((job) => { // TODO sort jobs by priority
            // find closest, qualified, unemployed raider
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
            if (closestRaider) closestRaider.setJob(job)
        })
    }

}
