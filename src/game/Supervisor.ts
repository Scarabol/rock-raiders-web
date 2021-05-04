import { Vector2 } from 'three'
import { clearIntervalSafe } from '../core/Util'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { JobCreateEvent, JobDeleteEvent } from '../event/WorldEvents'
import { CHECK_CLEARRUBBLE_INTERVAL, JOB_SCHEDULE_INTERVAL } from '../params'
import { EntityType } from './model/EntityType'
import { GameState } from './model/GameState'
import { GetToolJob } from './model/job/GetToolJob'
import { PublicJob } from './model/job/Job'
import { JobState } from './model/job/JobState'
import { PriorityIdentifier } from './model/job/PriorityIdentifier'
import { TrainJob } from './model/job/TrainJob'
import { Surface } from './model/map/Surface'
import { PathTarget } from './model/PathTarget'
import { Raider } from './model/raider/Raider'
import { RaiderTool } from './model/raider/RaiderTool'
import { RaiderTraining } from './model/raider/RaiderTraining'
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
            const result = j.jobstate === JobState.INCOMPLETE
            if (result && j.fulfiller.length < 1 && GameState.priorityList.isEnabled(j.getPriorityIdentifier())) availableJobs.push(j)
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
                let closestNeededTraining: RaiderTraining = null
                unemployedRaider.forEach((raider, index) => {
                    const requiredTool = job.getRequiredTool()
                    const hasRequiredTool = raider.hasTool(requiredTool)
                    const raiderTraining = job.getRequiredTraining()
                    const hasTraining = raider.hasTraining(raiderTraining)
                    const raiderPosition = raider.getPosition()
                    if (hasRequiredTool && hasTraining) {
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
                    } else if (!hasRequiredTool) {
                        const pathToToolstation = GameState.getBuildingsByType(EntityType.TOOLSTATION)
                            .map((b) => raider.findPathToTarget(new PathTarget(b.getPosition2D())))
                            .sort((l, r) => l.lengthSq - r.lengthSq)[0]
                        if (pathToToolstation) {
                            const dist = pathToToolstation.lengthSq
                            if (minToolDistance === null || dist < minToolDistance) {
                                closestToolRaider = raider
                                closestToolRaiderIndex = index
                                minToolDistance = dist
                                closestToolstationPosition = pathToToolstation.targetPosition // TODO use precalculated path to toolstation
                                closestNeededTool = requiredTool
                            }
                        }
                    } else {
                        const pathToTraining = GameState.getTrainingSites(raiderPosition, raiderTraining)
                            .map((site) => raider.findPathToTarget(new PathTarget(site.getPosition2D())))
                            .sort((l, r) => l.lengthSq - r.lengthSq)[0]
                        if (pathToTraining) {
                            const dist = pathToTraining.lengthSq
                            if (minTrainingDistance === null || dist < minTrainingDistance) {
                                closestTrainingRaider = raider
                                closestTrainingRaiderIndex = index
                                minTrainingDistance = dist
                                closestTrainingArea = raider.sceneMgr.terrain.getSurfaceFromWorld2D(pathToTraining.targetPosition) // TODO use precalculated path to training
                                closestNeededTraining = raiderTraining
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
            },
        )
        // TODO move unemployed raider out of building sites
    }

    checkUnclearedRubble() {
        if (!GameState.priorityList.isEnabled(PriorityIdentifier.aiPriorityClearing)) return
        GameState.raiders.forEach((raider) => {
            if (raider.job) return
            const startSurface = raider.sceneMgr.terrain.getSurfaceFromWorld(raider.getPosition())
            for (let rad = 0; rad < 10; rad++) {
                for (let x = startSurface.x - rad; x <= startSurface.x + rad; x++) {
                    for (let y = startSurface.y - rad; y <= startSurface.y + rad; y++) {
                        const surface = raider.sceneMgr.terrain.getSurfaceOrNull(x, y)
                        if (!(surface?.hasRubble()) || !surface?.discovered) continue
                        const clearRubbleJob = surface.createClearRubbleJob()
                        if (!clearRubbleJob) continue
                        const requiredTool = clearRubbleJob.getRequiredTool()
                        if (raider.hasTool(requiredTool)) {
                            raider.setJob(clearRubbleJob)
                        } else {
                            const pathToToolstation = GameState.getBuildingsByType(EntityType.TOOLSTATION)
                                .map((b) => raider.findPathToTarget(new PathTarget(b.getPosition2D())))
                                .sort((l, r) => l.lengthSq - r.lengthSq)[0]
                            if (pathToToolstation) {
                                raider.setJob(new GetToolJob(pathToToolstation.targetPosition, requiredTool), clearRubbleJob) // TODO use precalculated path to toolstation
                            }
                        }
                    }
                }
            }
        })
    }

}
