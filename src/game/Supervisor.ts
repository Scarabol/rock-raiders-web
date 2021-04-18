import { EventBus } from '../event/EventBus'
import { JobCreateEvent, JobDeleteEvent } from '../event/WorldEvents'
import { PublicJob } from './model/job/Job'
import { GameState } from './model/GameState'
import { Vector2 } from 'three'
import { Raider } from '../scene/model/Raider'
import { WorldManager } from '../scene/WorldManager'
import { CHECK_CLEARRUBBLE_INTERVAL, JOB_SCHEDULE_INTERVAL } from '../main'
import { Building } from './model/entity/building/Building'
import { GetToolJob } from './model/job/GetToolJob'
import { TrainJob } from './model/job/TrainJob'
import { clearIntervalSafe } from '../core/Util'
import { SurfaceJob, SurfaceJobType } from './model/job/SurfaceJob'
import { RaiderSkill } from '../scene/model/RaiderSkill'
import { RaiderTool } from '../scene/model/RaiderTool'
import { JobState } from './model/job/JobState'

export class Supervisor {

    worldMgr: WorldManager
    jobs: PublicJob[] = []
    assignInterval = null
    checkRubbleInterval = null

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
        this.checkRubbleInterval = setInterval(this.checkUnclearedRubble.bind(this), CHECK_CLEARRUBBLE_INTERVAL)
    }

    stop() {
        this.assignInterval = clearIntervalSafe(this.assignInterval)
        this.checkRubbleInterval = clearIntervalSafe(this.checkRubbleInterval)
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
        availableJobs.sort((left, right) => {
            return Math.sign(GameState.priorityList.getPriority(left) - GameState.priorityList.getPriority(right))
        })
        const unemployedRaider = GameState.raiders.filter((r) => !r.job)
        availableJobs.forEach((job) => { // XXX better use estimated time to complete job as metric
            let closestRaider: Raider = null
            let closestRaiderIndex: number = null
            let minDistance: number = null
            let closestToolRaider: Raider = null
            let closestToolRaiderIndex: number = null
            let minToolDistance: number = null
            let closestToolstationPosition: Vector2 = null
            let closestNeededTool: RaiderTool = null
            let closestTrainingRaider: Raider = null
            let closestTrainingRaiderIndex: number = null
            let minTrainingDistance: number = null
            let closestTrainingPath: Vector2 = null
            let closestNeededTraining: RaiderSkill = null
            unemployedRaider.forEach((raider, index) => {
                const raiderPosition2D = raider.getPosition2D()
                if (job.isQualified(raider)) {
                    const dist = job.getWorkplaces().map((p) => p.distanceToSquared(raiderPosition2D)).sort((l, r) => l - r)[0]
                    if (minDistance === null || dist < minDistance) {
                        closestRaider = raider
                        closestRaiderIndex = index
                        minDistance = dist
                    }
                } else {
                    const raiderPosition = raider.getPosition()
                    const neededTool = job.isQualifiedWithTool(raider)
                    if (neededTool) {
                        const pathToToolstation = GameState.getBuildingsByType(Building.TOOLSTATION)
                            .map((b) => raider.findPathToTarget(b.getPosition2D()))
                            .sort((l, r) => l.lengthSq - r.lengthSq)[0]
                        if (pathToToolstation) {
                            const dist = pathToToolstation.lengthSq
                            if (minToolDistance === null || dist < minToolDistance) {
                                closestToolRaider = raider
                                closestToolRaiderIndex = index
                                minToolDistance = dist
                                closestToolstationPosition = pathToToolstation.targetPosition // TODO use precalculated path to toolstation
                                closestNeededTool = neededTool
                            }
                        }
                    } else {
                        const neededTraining = job.isQualifiedWithTraining(raider)
                        if (neededTraining) {
                            const pathToTraining = GameState.getTrainingSites(raiderPosition, neededTraining)
                                .map((site) => raider.findPathToTarget(site.getPosition2D()))
                                .sort((l, r) => l.lengthSq - r.lengthSq)[0]
                            if (pathToTraining) {
                                const dist = pathToTraining.lengthSq
                                if (minTrainingDistance === null || dist < minTrainingDistance) {
                                    closestTrainingRaider = raider
                                    closestTrainingRaiderIndex = index
                                    minTrainingDistance = dist
                                    closestTrainingPath = pathToTraining.targetPosition // TODO use precalculated path to training
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
                closestTrainingRaider.setJob(new TrainJob(closestTrainingPath, closestNeededTraining), job)
                unemployedRaider.splice(closestTrainingRaiderIndex, 1)
            }
        })
    }

    checkUnclearedRubble() {
        GameState.raiders.forEach((raider) => {
            if (raider.job) return
            const startSurface = raider.worldMgr.sceneManager.terrain.getSurfaceFromWorld(raider.getPosition())
            for (let rad = 0; rad < 10; rad++) {
                for (let x = startSurface.x - rad; x <= startSurface.x + rad; x++) {
                    for (let y = startSurface.y - rad; y <= startSurface.y + rad; y++) {
                        const surface = raider.worldMgr.sceneManager.terrain.getSurfaceOrNull(x, y)
                        if (!(surface?.hasRubble()) || !surface.discovered || surface.hasJobType(SurfaceJobType.CLEAR_RUBBLE)) continue
                        const surfJob = new SurfaceJob(SurfaceJobType.CLEAR_RUBBLE, surface)
                        if (surfJob.isQualified(raider)) {
                            raider.setJob(surfJob)
                        } else {
                            const neededTool = surfJob.isQualifiedWithTool(raider)
                            if (neededTool) {
                                const pathToToolstation = GameState.getBuildingsByType(Building.TOOLSTATION)
                                    .map((b) => raider.findPathToTarget(b.getPosition2D()))
                                    .sort((l, r) => l.lengthSq - r.lengthSq)[0]
                                if (pathToToolstation) {
                                    raider.setJob(new GetToolJob(pathToToolstation.targetPosition, neededTool), surfJob) // TODO use precalculated path to toolstation
                                }
                            } else {
                                continue
                            }
                        }
                        EventBus.publishEvent(new JobCreateEvent(surfJob))
                        surface.updateJobColor()
                    }
                }
            }
        })
    }

}
