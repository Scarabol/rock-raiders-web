import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { UpdatePriorities } from '../event/LocalEvents'
import { JobCreateEvent } from '../event/WorldEvents'
import { CHECK_CLEAR_RUBBLE_INTERVAL, ITEM_ACTION_RANGE_SQ, JOB_SCHEDULE_INTERVAL } from '../params'
import { BuildingEntity } from './model/building/BuildingEntity'
import { Job } from './model/job/Job'
import { JobState } from './model/job/JobState'
import { PriorityEntry } from './model/job/PriorityEntry'
import { PriorityIdentifier } from './model/job/PriorityIdentifier'
import { GetToolJob } from './model/job/raider/GetToolJob'
import { MoveJob } from './model/job/MoveJob'
import { TrainRaiderJob } from './model/job/raider/TrainRaiderJob'
import { Raider } from './model/raider/Raider'
import { VehicleEntity } from './model/vehicle/VehicleEntity'
import { WorldManager } from './WorldManager'
import { PathTarget } from './model/PathTarget'

export class Supervisor {
    jobs: Job[] = []
    priorityIndexList: PriorityIdentifier[] = []
    priorityList: PriorityEntry[] = []
    assignJobsTimer: number = 0
    checkClearRubbleTimer: number = 0

    constructor(readonly worldMgr: WorldManager) {
        EventBus.registerEventListener(EventKey.JOB_CREATE, (event: JobCreateEvent) => {
            this.jobs.push(event.job)
        })
        EventBus.registerEventListener(EventKey.UPDATE_PRIORITIES, (event: UpdatePriorities) => {
            this.priorityList = [...event.priorityList]
            this.priorityIndexList = this.priorityList.map((p) => p.key)
        })
    }

    reset() {
        this.jobs = []
    }

    update(elapsedMs: number) {
        this.assignJobs(elapsedMs)
        this.checkUnclearedRubble(elapsedMs)
    }

    assignJobs(elapsedMs: number) {
        this.assignJobsTimer += elapsedMs
        if (this.assignJobsTimer < JOB_SCHEDULE_INTERVAL) return
        this.assignJobsTimer %= JOB_SCHEDULE_INTERVAL
        const availableJobs: Job[] = []
        this.jobs = this.jobs.filter((j) => {
            const result = j.jobState === JobState.INCOMPLETE
            if (result && !j.hasFulfiller() && this.isEnabled(j.priorityIdentifier)) {
                availableJobs.push(j)
            }
            return result
        })
        availableJobs.sort((left, right) => {
            return Math.sign(this.getPriority(left) - this.getPriority(right))
        })
        const unemployedRaider = new Set(this.worldMgr.entityMgr.raiders.filter((r) => r.isReadyToTakeAJob()))
        const unemployedVehicles = new Set(this.worldMgr.entityMgr.vehicles.filter((v) => v.isReadyToTakeAJob()))
        availableJobs.forEach((job) => { // XXX better use estimated time to complete job as metric
            let closestVehicle: VehicleEntity = null
            let closestVehicleDistance: number = null
            unemployedVehicles.forEach((vehicle) => {
                const pathToJob = job.carryItem ? vehicle.findShortestPath(PathTarget.fromLocation(job.carryItem.sceneEntity.position2D, ITEM_ACTION_RANGE_SQ)) : vehicle.findShortestPath(job.getWorkplace(vehicle))
                if (!pathToJob) return
                if (vehicle.isPrepared(job)) {
                    const dist = pathToJob.lengthSq
                    if (closestVehicleDistance === null || dist < closestVehicleDistance) {
                        closestVehicle = vehicle
                        closestVehicleDistance = dist
                    }
                }
            })
            if (closestVehicle) {
                closestVehicle.setJob(job)
                unemployedVehicles.delete(closestVehicle)
                return // if vehicle found do not check for raider
            }
            let closestRaider: Raider = null
            let minDistance: number = null
            let closestToolRaider: Raider = null
            let minToolDistance: number = null
            let closestToolstation: BuildingEntity = null
            const requiredTool = job.requiredTool
            let closestTrainingRaider: Raider = null
            let minTrainingDistance: number = null
            let closestTrainingArea: BuildingEntity = null
            const requiredTraining = job.requiredTraining
            unemployedRaider.forEach((raider) => {
                const pathToJob = job.carryItem ? raider.findShortestPath(PathTarget.fromLocation(job.carryItem.sceneEntity.position2D, ITEM_ACTION_RANGE_SQ)) : raider.findShortestPath(job.getWorkplace(raider))
                if (!pathToJob) return
                if (raider.isPrepared(job)) {
                    const dist = pathToJob.lengthSq
                    if (minDistance === null || dist < minDistance) {
                        closestRaider = raider
                        minDistance = dist
                    }
                } else if (!raider.hasTool(requiredTool)) {
                    const pathToToolstation = raider.findShortestPath(this.worldMgr.entityMgr.getGetToolTargets())
                    if (pathToToolstation) {
                        const dist = pathToToolstation.lengthSq
                        if (minToolDistance === null || dist < minToolDistance) {
                            closestToolRaider = raider
                            minToolDistance = dist
                            closestToolstation = pathToToolstation.target.building
                        }
                    }
                } else if (!raider.hasTraining(requiredTraining)) {
                    const pathToTrainingSite = raider.findShortestPath(this.worldMgr.entityMgr.getTrainingSiteTargets(requiredTraining))
                    if (pathToTrainingSite) {
                        const dist = pathToTrainingSite.lengthSq
                        if (minTrainingDistance === null || dist < minTrainingDistance) {
                            closestTrainingRaider = raider
                            minTrainingDistance = dist
                            closestTrainingArea = pathToTrainingSite.target.building
                        }
                    }
                }
            })
            if (closestRaider) {
                closestRaider.setJob(job)
                unemployedRaider.delete(closestRaider)
            } else if (closestToolRaider) {
                closestToolRaider.setJob(new GetToolJob(this.worldMgr.entityMgr, requiredTool, closestToolstation), job)
                unemployedRaider.delete(closestToolRaider)
            } else if (closestTrainingRaider) {
                closestTrainingRaider.setJob(new TrainRaiderJob(this.worldMgr.entityMgr, requiredTraining, closestTrainingArea), job)
                unemployedRaider.delete(closestTrainingRaider)
            }
        })
        unemployedRaider.forEach((raider) => {
            const blockedSite = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(raider.sceneEntity.position)?.site
            if (blockedSite?.buildingType) raider.setJob(new MoveJob(raider, blockedSite.getWalkOutSurface().getRandomPosition()))
        })
        unemployedVehicles.forEach((vehicle) => {
            const blockedSite = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(vehicle.sceneEntity.position)?.site
            if (blockedSite) {
                vehicle.setJob(new MoveJob(vehicle, blockedSite.getWalkOutSurface().getRandomPosition()))
            } else {
                vehicle.unblockTeleporter()
            }
        })
    }

    checkUnclearedRubble(elapsedMs: number) {
        this.checkClearRubbleTimer += elapsedMs
        if (this.checkClearRubbleTimer < CHECK_CLEAR_RUBBLE_INTERVAL) return
        this.checkClearRubbleTimer %= CHECK_CLEAR_RUBBLE_INTERVAL
        if (!this.isEnabled(PriorityIdentifier.CLEARING)) return
        this.worldMgr.entityMgr.raiders.forEach((raider) => {
            if (!raider.isReadyToTakeAJob()) return
            const startSurface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(raider.sceneEntity.position)
            for (let rad = 0; rad < 10; rad++) {
                for (let x = startSurface.x - rad; x <= startSurface.x + rad; x++) {
                    for (let y = startSurface.y - rad; y <= startSurface.y + rad; y++) {
                        const surface = this.worldMgr.sceneMgr.terrain.getSurfaceOrNull(x, y)
                        if (!(surface?.hasRubble()) || !surface?.discovered) continue
                        const clearRubbleJob = surface.setupClearRubbleJob()
                        if (!clearRubbleJob || clearRubbleJob.hasFulfiller() || !raider.findShortestPath(clearRubbleJob.lastRubblePositions)) continue
                        if (raider.hasTool(clearRubbleJob.requiredTool)) {
                            raider.setJob(clearRubbleJob)
                            return
                        } else {
                            const pathToToolstation = raider.findShortestPath(this.worldMgr.entityMgr.getGetToolTargets())
                            if (pathToToolstation) {
                                raider.setJob(new GetToolJob(this.worldMgr.entityMgr, clearRubbleJob.requiredTool, pathToToolstation.target.building), clearRubbleJob)
                                return
                            }
                        }
                    }
                }
            }
        })
    }

    private getPriority(job: Job) {
        return this.priorityIndexList.indexOf(job.priorityIdentifier)
    }

    private isEnabled(priorityIdentifier: PriorityIdentifier): boolean {
        return !!this.priorityList.find((p) => p.key === priorityIdentifier)?.enabled
    }
}
