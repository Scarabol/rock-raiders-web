import { EventKey } from '../event/EventKeyEnum'
import { JobCreateEvent, UpdatePriorities } from '../event/WorldEvents'
import { CHECK_CLEAR_RUBBLE_INTERVAL, ITEM_ACTION_RANGE_SQ, JOB_SCHEDULE_INTERVAL } from '../params'
import { BuildingEntity } from './model/building/BuildingEntity'
import { Job } from './model/job/Job'
import { JobState } from './model/job/JobState'
import { PriorityIdentifier } from './model/job/PriorityIdentifier'
import { GetToolJob } from './model/job/raider/GetToolJob'
import { MoveJob } from './model/job/MoveJob'
import { TrainRaiderJob } from './model/job/raider/TrainRaiderJob'
import { Raider } from './model/raider/Raider'
import { VehicleEntity } from './model/vehicle/VehicleEntity'
import { WorldManager } from './WorldManager'
import { PathTarget } from './model/PathTarget'
import { EntityType } from './model/EntityType'
import { EatBarracksJob } from './model/job/raider/EatBarracksJob'
import { EventBroker } from '../event/EventBroker'
import { GameState } from './model/GameState'
import { SurfaceType } from './terrain/SurfaceType'

/**
 * Tutorial01
 * - Raider should pick up shovel to clear rubble, but not automatically start clearing it
 * - Once job assigned by player, raider should continue and clear rubble
 * Tutorial02
 * - Raider should start drilling when drill job created
 * Tutorial03
 * - Raider should pick shovel and start clearing rubble
 * Tutorial08
 * - Raider should not pick up shovel for clearing
 * - Raider should not pick crystal until moved to same surface
 */
export class Supervisor {
    jobs: Job[] = []
    priorityIndexList: PriorityIdentifier[] = []
    assignJobsTimer: number = 0
    checkClearRubbleTimer: number = 0
    autoClearRubble: boolean = true

    constructor(readonly worldMgr: WorldManager) {
        EventBroker.subscribe(EventKey.JOB_CREATE, (event: JobCreateEvent) => {
            this.jobs.push(event.job)
        })
        EventBroker.subscribe(EventKey.UPDATE_PRIORITIES, (event: UpdatePriorities) => {
            event.priorityList.forEach((p) => {
                if (!p.enabled) {
                    this.worldMgr.entityMgr.raiders.forEach((r) => {
                        if (r.job?.priorityIdentifier === p.key) r.stopJob()
                    })
                    this.worldMgr.entityMgr.vehicles.forEach((v) => {
                        if (v.job?.priorityIdentifier === p.key) v.stopJob()
                    })
                }
            })
            this.priorityIndexList = GameState.priorityList.current.map((p) => p.key)
        })
        EventBroker.subscribe(EventKey.LEVEL_SELECTED, (event) => {
            this.jobs = []
            this.assignJobsTimer = 0
            this.checkClearRubbleTimer = 0
            this.autoClearRubble = event.levelConf.levelName.toLowerCase() !== 'tutorial01'
        })
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
            if (result && !j.hasFulfiller() && GameState.priorityList.isEnabled(j.priorityIdentifier) && (this.autoClearRubble || j.priorityIdentifier !== PriorityIdentifier.CLEARING)) {
                availableJobs.push(j)
            }
            return result
        })
        availableJobs.sort((left, right) => {
            return Math.sign(GameState.priorityList.getPriority(left.priorityIdentifier) - GameState.priorityList.getPriority(right.priorityIdentifier))
        })
        this.worldMgr.entityMgr.raiders.forEach((raider) => {
            if (!raider.isReadyToTakeAJob() || raider.foodLevel > 0.25) return
            const barracks = this.worldMgr.entityMgr.getClosestBuildingByType(raider.getPosition(), EntityType.BARRACKS)
            if (barracks) raider.setJob(new EatBarracksJob(this.worldMgr.entityMgr, barracks))
        })
        const unemployedRaider = new Set(this.worldMgr.entityMgr.raiders.filter((r) => r.isReadyToTakeAJob()))
        const unemployedVehicles = new Set(this.worldMgr.entityMgr.vehicles.filter((v) => v.isReadyToTakeAJob()))
        availableJobs.forEach((job) => { // XXX better use estimated time to complete job as metric
            try {
                let closestVehicle: VehicleEntity | undefined
                let closestVehicleDistance: number = Infinity
                unemployedVehicles.forEach((vehicle) => {
                    try {
                        const pathToWorkplace = vehicle.findShortestPath(job.getWorkplace(vehicle))
                        if (!pathToWorkplace) return
                        const pathToJob = job.carryItem ? vehicle.findShortestPath(PathTarget.fromLocation(job.carryItem.getPosition2D(), ITEM_ACTION_RANGE_SQ)) : pathToWorkplace
                        if (!pathToJob) return
                        if (vehicle.isPrepared(job)) {
                            const dist = pathToJob.lengthSq
                            if (dist < closestVehicleDistance) {
                                closestVehicle = vehicle
                                closestVehicleDistance = dist
                            }
                        }
                    } catch (e) {
                        console.error(e)
                    }
                })
                if (closestVehicle) {
                    closestVehicle.setJob(job)
                    unemployedVehicles.delete(closestVehicle)
                    return // if vehicle found do not check for raider
                }
                let closestRaider: Raider | undefined
                let minDistance: number = Infinity
                let closestToolRaider: Raider | undefined
                let minToolDistance: number = Infinity
                let closestToolstation: BuildingEntity | undefined
                const requiredTool = job.requiredTool
                let closestTrainingRaider: Raider | undefined
                let minTrainingDistance: number = Infinity
                let closestTrainingArea: BuildingEntity | undefined
                const requiredTraining = job.requiredTraining
                unemployedRaider.forEach((raider) => {
                    try {
                        const pathToWorkplace = raider.findShortestPath(job.getWorkplace(raider))
                        if (!pathToWorkplace) return
                        const pathToJob = job.carryItem ? raider.findShortestPath(PathTarget.fromLocation(job.carryItem.getPosition2D(), ITEM_ACTION_RANGE_SQ)) : pathToWorkplace
                        if (!pathToJob) return
                        if (raider.isPrepared(job)) {
                            const dist = pathToJob.lengthSq
                            if (dist < minDistance) {
                                closestRaider = raider
                                minDistance = dist
                            }
                        } else if (!raider.hasTool(requiredTool)) {
                            const pathToToolstation = raider.findShortestPath(this.worldMgr.entityMgr.getGetToolTargets())
                            if (pathToToolstation) {
                                const dist = pathToToolstation.lengthSq
                                if (dist < minToolDistance) {
                                    closestToolRaider = raider
                                    minToolDistance = dist
                                    closestToolstation = pathToToolstation.target.building
                                }
                            }
                        } else if (!raider.hasTraining(requiredTraining)) {
                            const pathToTrainingSite = raider.findShortestPath(this.worldMgr.entityMgr.getTrainingSiteTargets(requiredTraining))
                            if (pathToTrainingSite) {
                                const dist = pathToTrainingSite.lengthSq
                                if (dist < minTrainingDistance) {
                                    closestTrainingRaider = raider
                                    minTrainingDistance = dist
                                    closestTrainingArea = pathToTrainingSite.target.building
                                }
                            }
                        }
                    } catch (e) {
                        console.error(e)
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
            } catch (e) {
                console.error(e)
            }
        })
        unemployedRaider.forEach((raider) => {
            try {
                const raiderSurface = raider.getSurface()
                const blockedSite = raiderSurface.site
                if (blockedSite?.buildingType) raider.setJob(new MoveJob(blockedSite.getWalkOutSurface().getRandomPosition()))
                if (raiderSurface.surfaceType === SurfaceType.LAVA5) {
                    const safeNeighbor = raiderSurface.neighbors.filter((n) => n.isWalkable()).random() || raiderSurface
                    raider.setJob(new MoveJob(safeNeighbor.getRandomPosition()))
                }
            } catch (e) {
                console.error(e)
            }
        })
        unemployedVehicles.forEach((vehicle) => {
            try {
                if (vehicle.isReadyToTakeAJob() && vehicle.canClear()) {
                    const startSurface = vehicle.getSurface()
                    for (let rad = 0; rad < 10; rad++) {
                        for (let x = startSurface.x - rad; x <= startSurface.x + rad; x++) {
                            for (let y = startSurface.y - rad; y <= startSurface.y + rad; y++) {
                                const surface = this.worldMgr.sceneMgr.terrain.getSurfaceOrNull(x, y)
                                if (!(surface?.hasRubble()) || !surface?.discovered) continue
                                const clearRubbleJob = surface.setupClearRubbleJob()
                                if (!clearRubbleJob || clearRubbleJob.hasFulfiller() || !vehicle.findShortestPath(clearRubbleJob.lastRubblePositions)) continue
                                vehicle.setJob(clearRubbleJob)
                            }
                        }
                    }
                }
                const blockedSite = vehicle.getSurface().site
                if (blockedSite?.buildingType) {
                    vehicle.setJob(new MoveJob(blockedSite.getWalkOutSurface().getRandomPosition()))
                } else {
                    vehicle.unblockBuildingPowerPath()
                }
            } catch (e) {
                console.error(e)
            }
        })
    }

    checkUnclearedRubble(elapsedMs: number) {
        this.checkClearRubbleTimer += elapsedMs
        if (this.checkClearRubbleTimer < CHECK_CLEAR_RUBBLE_INTERVAL) return
        this.checkClearRubbleTimer %= CHECK_CLEAR_RUBBLE_INTERVAL
        this.worldMgr.entityMgr.raiders.forEach((raider) => {
            try {
                if (!raider.isReadyToTakeAJob()) return
                const startSurface = raider.getSurface()
                for (let rad = 0; rad < 10; rad++) {
                    for (let x = startSurface.x - rad; x <= startSurface.x + rad; x++) {
                        for (let y = startSurface.y - rad; y <= startSurface.y + rad; y++) {
                            const surface = this.worldMgr.sceneMgr.terrain.getSurfaceOrNull(x, y)
                            if (!surface?.hasRubble() || !surface?.discovered) continue
                            const clearRubbleJob = surface.setupClearRubbleJob()
                            if (!clearRubbleJob || clearRubbleJob.hasFulfiller()) continue
                            if (raider.hasTool(clearRubbleJob.requiredTool)) {
                                if (GameState.priorityList.isEnabled(PriorityIdentifier.CLEARING) && this.autoClearRubble && raider.findShortestPath(clearRubbleJob.lastRubblePositions)) {
                                    raider.setJob(clearRubbleJob)
                                }
                                return
                            } else {
                                const pathToToolstation = raider.findShortestPath(this.worldMgr.entityMgr.getGetToolTargets())
                                if (pathToToolstation) {
                                    raider.setJob(new GetToolJob(this.worldMgr.entityMgr, clearRubbleJob.requiredTool, pathToToolstation.target.building))
                                    return
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.error(e)
            }
        })
    }
}
