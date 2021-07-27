import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { UpdatePriorities } from '../event/LocalEvents'
import { JobCreateEvent, JobDeleteEvent } from '../event/WorldEvents'
import { CHECK_CLEAR_RUBBLE_INTERVAL, JOB_SCHEDULE_INTERVAL } from '../params'
import { EntityManager } from './EntityManager'
import { BuildingEntity } from './model/building/BuildingEntity'
import { BuildingPathTarget } from './model/building/BuildingPathTarget'
import { JobState } from './model/job/JobState'
import { ManVehicleJob } from './model/job/ManVehicleJob'
import { PriorityEntry } from './model/job/PriorityEntry'
import { PriorityIdentifier } from './model/job/PriorityIdentifier'
import { GetToolJob } from './model/job/raider/GetToolJob'
import { GetToolPathTarget } from './model/job/raider/GetToolPathTarget'
import { MoveJob } from './model/job/raider/MoveJob'
import { TrainRaiderJob } from './model/job/raider/TrainRaiderJob'
import { ShareableJob } from './model/job/ShareableJob'
import { Raider } from './model/raider/Raider'
import { VehicleEntity } from './model/vehicle/VehicleEntity'
import { SceneManager } from './SceneManager'

export type SupervisedJob = ShareableJob | ManVehicleJob

export class Supervisor {

    sceneMgr: SceneManager
    entityMgr: EntityManager
    jobs: SupervisedJob[] = []
    priorityIndexList: PriorityIdentifier[] = []
    priorityList: PriorityEntry[] = []
    assignJobsTimer: number = 0
    checkClearRubbleTimer: number = 0

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        this.sceneMgr = sceneMgr
        this.entityMgr = entityMgr
        EventBus.registerEventListener(EventKey.JOB_CREATE, (event: JobCreateEvent) => {
            this.jobs.push(event.job)
        })
        EventBus.registerEventListener(EventKey.JOB_DELETE, (event: JobDeleteEvent) => {
            event.job.cancel()
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
        const availableJobs: SupervisedJob[] = []
        this.jobs = this.jobs.filter((j) => {
            const result = j.jobState === JobState.INCOMPLETE
            if (result && !j.hasFulfiller() && this.isEnabled(j.getPriorityIdentifier())) {
                availableJobs.push(j)
            }
            return result
        })
        availableJobs.sort((left, right) => {
            return Math.sign(this.getPriority(left) - this.getPriority(right))
        })
        const unemployedRaider = new Set(this.entityMgr.raiders.filter((r) => r.isReadyToTakeAJob()))
        const unemployedVehicles = new Set(this.entityMgr.vehicles.filter((v) => v.isReadyToTakeAJob()))
        availableJobs.forEach((job) => { // XXX better use estimated time to complete job as metric
            let closestVehicle: VehicleEntity = null
            let closestVehicleDistance: number = null
            unemployedVehicles.forEach((vehicle) => {
                if (vehicle.isPrepared(job)) {
                    const pathToJob = job.getWorkplaces().map((b) => vehicle.findPathToTarget(b))
                        .filter((t) => !!t)
                        .sort((l, r) => l.lengthSq - r.lengthSq)[0]
                    if (pathToJob) {
                        const dist = pathToJob.lengthSq
                        if (closestVehicleDistance === null || dist < closestVehicleDistance) {
                            closestVehicle = vehicle
                            closestVehicleDistance = dist
                        }
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
            const requiredTool = job.getRequiredTool()
            let closestTrainingRaider: Raider = null
            let minTrainingDistance: number = null
            let closestTrainingArea: BuildingEntity = null
            const requiredTraining = job.getRequiredTraining()
            unemployedRaider.forEach((raider) => {
                const hasRequiredTool = raider.hasTool(requiredTool)
                const hasTraining = raider.hasTraining(requiredTraining)
                if (raider.isPrepared(job)) {
                    const pathToJob = job.getWorkplaces().map((b) => raider.findPathToTarget(b))
                        .filter((t) => !!t)
                        .sort((l, r) => l.lengthSq - r.lengthSq)[0]
                    if (pathToJob) {
                        const dist = pathToJob.lengthSq
                        if (minDistance === null || dist < minDistance) {
                            closestRaider = raider
                            minDistance = dist
                        }
                    }
                } else if (!hasRequiredTool) {
                    const pathToToolstation = this.entityMgr.getGetToolTargets()
                        .map((b) => raider.findPathToTarget(b))
                        .filter((p) => !!p)
                        .sort((l, r) => l.lengthSq - r.lengthSq)[0]
                    if (pathToToolstation) {
                        const dist = pathToToolstation.lengthSq
                        if (minToolDistance === null || dist < minToolDistance) {
                            closestToolRaider = raider
                            minToolDistance = dist
                            closestToolstation = (pathToToolstation.target as BuildingPathTarget).building
                        }
                    }
                } else if (!hasTraining) {
                    const pathToTrainingSite = this.entityMgr.getTrainingSiteTargets(requiredTraining)
                        .map((b) => raider.findPathToTarget(b))
                        .filter((p) => !!p)
                        .sort((l, r) => l.lengthSq - r.lengthSq)[0]
                    if (pathToTrainingSite) {
                        const dist = pathToTrainingSite.lengthSq
                        if (minTrainingDistance === null || dist < minTrainingDistance) {
                            closestTrainingRaider = raider
                            minTrainingDistance = dist
                            closestTrainingArea = (pathToTrainingSite.target as BuildingPathTarget).building
                        }
                    }
                }
            })
            if (closestRaider) {
                closestRaider.setJob(job)
                unemployedRaider.delete(closestRaider)
            } else if (closestToolRaider) {
                closestToolRaider.setJob(new GetToolJob(this.entityMgr, requiredTool, closestToolstation), job)
                unemployedRaider.delete(closestToolRaider)
            } else if (closestTrainingRaider) {
                closestTrainingRaider.setJob(new TrainRaiderJob(this.entityMgr, requiredTraining, closestTrainingArea), job)
                unemployedRaider.delete(closestTrainingRaider)
            }
        })
        unemployedRaider.forEach((raider) => {
            const blockedSite = raider.sceneEntity.surfaces.find((s) => !!s.site)
            if (blockedSite) raider.setJob(new MoveJob(blockedSite.site.getWalkOutSurface().getRandomPosition()))
        })
        unemployedVehicles.forEach((vehicle) => {
            const blockedSite = vehicle.sceneEntity.surfaces.find((s) => !!s.site && !s.building?.teleport)
            if (blockedSite) {
                vehicle.setJob(new MoveJob(blockedSite.site.getWalkOutSurface().getRandomPosition()))
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
        this.entityMgr.raiders.forEach((raider) => {
            if (!raider.isReadyToTakeAJob()) return
            const startSurface = raider.sceneEntity.surfaces[0]
            for (let rad = 0; rad < 10; rad++) {
                for (let x = startSurface.x - rad; x <= startSurface.x + rad; x++) {
                    for (let y = startSurface.y - rad; y <= startSurface.y + rad; y++) {
                        const surface = this.sceneMgr.terrain.getSurfaceOrNull(x, y)
                        if (!(surface?.hasRubble()) || !surface?.discovered) continue
                        const clearRubbleJob = surface.createClearRubbleJob()
                        if (!clearRubbleJob || clearRubbleJob.hasFulfiller()) continue
                        const requiredTool = clearRubbleJob.getRequiredTool()
                        if (raider.hasTool(requiredTool)) {
                            raider.setJob(clearRubbleJob)
                            return
                        } else {
                            const pathToToolstation = this.entityMgr.getGetToolTargets()
                                .map((b) => raider.findPathToTarget(b))
                                .filter((p) => !!p)
                                .sort((l, r) => l.lengthSq - r.lengthSq)[0]
                            if (pathToToolstation) {
                                raider.setJob(new GetToolJob(this.entityMgr, requiredTool, (pathToToolstation.target as GetToolPathTarget).building), clearRubbleJob)
                                return
                            }
                        }
                    }
                }
            }
        })
    }

    getPriority(job: SupervisedJob) {
        return this.priorityIndexList.indexOf(job.getPriorityIdentifier())
    }

    isEnabled(priorityIdentifier: PriorityIdentifier): boolean {
        return !!this.priorityList.find((p) => p.key === priorityIdentifier)?.enabled
    }

}
