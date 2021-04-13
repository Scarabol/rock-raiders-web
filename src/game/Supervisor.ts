import { EventBus } from '../event/EventBus'
import { JobCreateEvent, JobDeleteEvent } from '../event/WorldEvents'
import { JobState, PublicJob } from './model/job/Job'
import { GameState } from './model/GameState'
import { Vector3 } from 'three'
import { Raider } from '../scene/model/Raider'
import { WorldManager } from '../scene/WorldManager'
import { JOB_SCHEDULE_INTERVAL } from '../main'
import { Building } from './model/entity/building/Building'
import { GetToolJob } from './model/job/GetToolJob'
import { TrainJob } from './model/job/TrainJob'

export class Supervisor {

    worldMgr: WorldManager
    jobs: PublicJob[] = []
    assignInterval = null

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
        this.assignInterval = setInterval(this.assignJobs.bind(this), JOB_SCHEDULE_INTERVAL)
    }

    stop() {
        if (this.assignInterval) clearInterval(this.assignInterval)
        this.assignInterval = null
        GameState.raiders.forEach((r) => r.resetWorkInterval())
        GameState.raidersUndiscovered.forEach((r) => r.resetWorkInterval())
        GameState.vehicles.forEach((v) => v.resetWorkInterval())
        GameState.vehiclesUndiscovered.forEach((v) => v.resetWorkInterval())
    }

    assignJobs() {
        const availableJobs: PublicJob[] = []
        this.jobs = this.jobs.filter((j) => {
            const result = j.jobstate === JobState.OPEN
            if (result && j.fulfiller.length < 1) availableJobs.push(j)
            return result
        })
        if (availableJobs.length < 1) return
        availableJobs.sort((left, right) => {
            return Math.sign(GameState.priorityList.getPriority(left) - GameState.priorityList.getPriority(right))
        })
        const unemployedRaider = GameState.raiders.filter((r) => !r.job)
        availableJobs.forEach((job) => { // TODO refactor: better use estimated time to complete as metric
            let closestRaider: Raider = null
            let closestRaiderIndex: number = null
            let minDistance: number = null
            let closestToolRaider: Raider = null
            let closestToolRaiderIndex: number = null
            let minToolDistance: number = null
            let closestToolstationPosition: Vector3 = null
            let closestNeededTool: string = null
            let closestTrainingRaider: Raider = null
            let closestTrainingRaiderIndex: number = null
            let minTrainingDistance: number = null
            let closestTrainingLocation: Vector3 = null
            let closestNeededTraining: string = null
            unemployedRaider.forEach((raider, index) => {
                const raiderPosition = raider.getPosition()
                if (job.isQualified(raider)) {
                    const dist = job.getPosition().distanceToSquared(raiderPosition)
                    if (minDistance === null || dist < minDistance) {
                        closestRaider = raider
                        closestRaiderIndex = index
                        minDistance = dist
                    }
                } else {
                    const neededTool = job.isQualifiedWithTool(raider)
                    if (neededTool) {
                        const closestToolstation = GameState.getClosestBuildingByType(raiderPosition, Building.TOOLSTATION)
                        if (closestToolstation) {
                            const toolstationPosition = closestToolstation.getPosition()
                            const dist = toolstationPosition.distanceToSquared(raiderPosition)
                            if (minToolDistance === null || dist < minToolDistance) {
                                closestToolRaider = raider
                                closestToolRaiderIndex = index
                                minToolDistance = dist
                                closestToolstationPosition = toolstationPosition
                                closestNeededTool = neededTool
                            }
                        }
                    } else {
                        const neededTraining = job.isQualifiedWithTraining(raider)
                        if (neededTraining) {
                            const trainingLocation = GameState.getClosestTrainingSite(raiderPosition, neededTraining).getPosition()
                            if (trainingLocation) {
                                const dist = trainingLocation.distanceToSquared(raiderPosition)
                                if (minTrainingDistance === null || dist < minTrainingDistance) {
                                    closestTrainingRaider = raider
                                    closestTrainingRaiderIndex = index
                                    minTrainingDistance = dist
                                    closestTrainingLocation = trainingLocation
                                    closestNeededTraining = neededTraining
                                }
                            }
                        }
                    }
                }
            })
            if (closestRaider) {
                closestRaider.setJob(job)
                unemployedRaider.splice(closestRaiderIndex, 1)
            } else if (closestToolRaider) {
                closestToolRaider.setJob(new GetToolJob(closestToolstationPosition, closestNeededTool), job)
                unemployedRaider.splice(closestToolRaiderIndex, 1)
            } else if (closestTrainingRaider) {
                closestTrainingRaider.setJob(new TrainJob(closestTrainingLocation, closestNeededTraining), job)
                unemployedRaider.splice(closestTrainingRaiderIndex, 1)
            }
        })
    }

}
