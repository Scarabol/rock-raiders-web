import { Vector2 } from 'three'
import { clearIntervalSafe } from '../core/Util'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { JobCreateEvent, JobDeleteEvent } from '../event/WorldEvents'
import { CHECK_CLEARRUBBLE_INTERVAL, JOB_SCHEDULE_INTERVAL } from '../params'
import { Building } from './model/building/Building'
import { GameState } from './model/GameState'
import { GetToolJob } from './model/job/GetToolJob'
import { PublicJob } from './model/job/Job'
import { JobState } from './model/job/JobState'
import { JobType } from './model/job/JobType'
import { ClearRubbleJob } from './model/job/surface/ClearRubbleJob'
import { TrainJob } from './model/job/TrainJob'
import { Surface } from './model/map/Surface'
import { PathTarget } from './model/PathTarget'
import { Raider } from './model/raider/Raider'
import { RaiderSkill } from './model/raider/RaiderSkill'
import { RaiderTool } from './model/raider/RaiderTool'
import { WorldManager } from './WorldManager'

export class Supervisor {

    worldMgr: WorldManager
    jobs: PublicJob[] = []
    assignInterval = null
    checkRubbleInterval = null

    constructor(worldMgr: WorldManager) {
        this.worldMgr = worldMgr
        EventBus.registerEventListener(EventKey.JOB_CREATE, (event: JobCreateEvent) => {
            this.jobs.push(event.job)
        })
        EventBus.registerEventListener(EventKey.JOB_DELETE, (event: JobDeleteEvent) => {
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
            let closestTrainingArea: Surface = null
            let closestNeededTraining: RaiderSkill = null
            unemployedRaider.forEach((raider, index) => {
                if (job.isQualified(raider)) {
                    const pathToJob = job.getWorkplaces().map((b) => raider.findPathToTarget(b))
                        .sort((l, r) => l.lengthSq - r.lengthSq)[0]
                    if (pathToJob) {
                        const dist = pathToJob.lengthSq // TODO use precalculated path to job
                        if (minDistance === null || dist < minDistance) {
                            closestRaider = raider
                            closestRaiderIndex = index
                            minDistance = dist
                        }
                    }
                } else {
                    const raiderPosition = raider.getPosition()
                    const neededTool = job.isQualifiedWithTool(raider)
                    if (neededTool) {
                        const pathToToolstation = GameState.getBuildingsByType(Building.TOOLSTATION)
                            .map((b) => raider.findPathToTarget(new PathTarget(b.getPosition2D())))
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
                                .map((site) => raider.findPathToTarget(new PathTarget(site.getPosition2D())))
                                .sort((l, r) => l.lengthSq - r.lengthSq)[0]
                            if (pathToTraining) {
                                const dist = pathToTraining.lengthSq
                                if (minTrainingDistance === null || dist < minTrainingDistance) {
                                    closestTrainingRaider = raider
                                    closestTrainingRaiderIndex = index
                                    minTrainingDistance = dist
                                    closestTrainingArea = raider.worldMgr.sceneManager.terrain.getSurfaceFromWorld2D(pathToTraining.targetPosition) // TODO use precalculated path to training
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
                closestTrainingRaider.setJob(new TrainJob(closestTrainingArea, closestNeededTraining), job)
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
                        if (!(surface?.hasRubble()) || !surface.discovered || surface.hasJobType(JobType.CLEAR_RUBBLE)) continue
                        const surfJob = new ClearRubbleJob(surface)
                        if (surfJob.isQualified(raider)) {
                            raider.setJob(surfJob)
                        } else {
                            const neededTool = surfJob.isQualifiedWithTool(raider)
                            if (neededTool) {
                                const pathToToolstation = GameState.getBuildingsByType(Building.TOOLSTATION)
                                    .map((b) => raider.findPathToTarget(new PathTarget(b.getPosition2D())))
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
