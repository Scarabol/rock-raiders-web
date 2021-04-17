import { SelectionType } from '../../game/model/Selectable'
import { EventBus } from '../../event/EventBus'
import { RaiderSelected, SelectionEvent } from '../../event/LocalEvents'
import { FulfillerEntity } from './FulfillerEntity'
import { GameState } from '../../game/model/GameState'
import { MathUtils, Vector3 } from 'three'
import { EntityAddedEvent, EntityType, OreFoundEvent, RaiderTrained } from '../../event/WorldEvents'
import { CrystalFoundEvent, RaiderDiscoveredEvent } from '../../event/WorldLocationEvent'
import { BaseActivity } from './activities/BaseActivity'
import { RaiderActivity } from './activities/RaiderActivity'
import { DynamiteJob, SurfaceJob, SurfaceJobType } from '../../game/model/job/SurfaceJob'
import { SurfaceType } from './map/SurfaceType'
import { getRandom, removeFromArray } from '../../core/Util'
import { Crystal } from './collect/Crystal'
import { Ore } from './collect/Ore'
import { JOB_ACTION_RANGE } from '../../main'
import { CollectJob } from '../../game/model/job/CollectJob'
import { TrainJob } from '../../game/model/job/TrainJob'
import { GetToolJob } from '../../game/model/job/GetToolJob'
import { ResourceManager } from '../../resource/ResourceManager'
import { RaiderTool } from './RaiderTool'
import degToRad = MathUtils.degToRad
import { RaiderSkill } from './RaiderSkill'
import { JobType } from '../../game/model/job/JobType'

export class Raider extends FulfillerEntity {

    tools: RaiderTool[] = []
    skills: RaiderSkill[] = []

    constructor() {
        super(SelectionType.PILOT, 'mini-figures/pilot/pilot.ae')
        this.tools = [RaiderTool.DRILL]
        this.skills = []
        this.pickSphereRadius = this.stats.PickSphere / 2
    }

    get stats() {
        return ResourceManager.stats.Pilot
    }

    findPathToTarget(target: Vector3): Vector3[] {
        return this.worldMgr.sceneManager.terrain.findPath(this.getPosition(), target)
    }

    onDiscover() {
        super.onDiscover()
        removeFromArray(GameState.raidersUndiscovered, this)
        GameState.raiders.push(this)
        EventBus.publishEvent(new EntityAddedEvent(EntityType.RAIDER, this))
        EventBus.publishEvent(new RaiderDiscoveredEvent(this.getPosition()))
    }

    select(): SelectionEvent {
        this.selectionFrame.visible = true
        if (!this.selected) {
            this.selected = true
            this.changeActivity(RaiderActivity.Stand)
            return new RaiderSelected(this)
        }
        return null
    }

    getSelectionCenter(): Vector3 {
        return this.pickSphere ? new Vector3().copy(this.pickSphere.position).applyMatrix4(this.group.matrixWorld) : null
    }

    isDriving(): boolean {
        return false // TODO implement vehicles
    }

    getRouteActivity(): BaseActivity {
        if (this.isOnRubble()) {
            return !!this.carries ? RaiderActivity.CarryRubble : RaiderActivity.routeRubble
        } else {
            return !!this.carries ? RaiderActivity.Carry : RaiderActivity.Route
        }
    }

    moveToTarget(target): boolean {
        const result = super.moveToTarget(target)
        if (result) {
            // FIXME check if Raider stepped on a Spider
        }
        return result
    }

    work() {
        if (!this.job || this.selected) return
        if (this.job.type === JobType.SURFACE) {
            const surfJob = this.job as SurfaceJob
            const surfaceJobType = surfJob.workType
            if (surfaceJobType === SurfaceJobType.DRILL) {
                if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                    this.moveToTarget(this.job.getPosition())
                } else {
                    let drillTimeMs = null
                    if (surfJob.surface.surfaceType === SurfaceType.HARD_ROCK) {
                        drillTimeMs = this.stats.HardDrillTime[this.level] * 1000
                    } else if (surfJob.surface.surfaceType === SurfaceType.LOOSE_ROCK) {
                        drillTimeMs = this.stats.LooseDrillTime[this.level] * 1000
                    } else if (surfJob.surface.surfaceType === SurfaceType.DIRT) {
                        drillTimeMs = this.stats.SoilDrillTime[this.level] * 1000
                    } else if (surfJob.surface.surfaceType === SurfaceType.ORE_SEAM ||
                        surfJob.surface.surfaceType === SurfaceType.CRYSTAL_SEAM) {
                        drillTimeMs = this.stats.SeamDrillTime[this.level] * 1000
                    }
                    if (drillTimeMs === 0) console.warn('According to cfg this entity cannot drill this material')
                    const focusPoint = surfJob.surface.getCenterWorld()
                    focusPoint.y = this.group.position.y
                    this.group.lookAt(focusPoint)
                    this.changeActivity(RaiderActivity.Drill, () => {
                        if (surfJob.surface.seamLevel > 0) {
                            surfJob.surface.seamLevel--
                            const vec = new Vector3().copy(this.getPosition()).sub(surfJob.surface.getCenterWorld())
                                .multiplyScalar(0.3 + getRandom(3) / 10)
                                .applyAxisAngle(new Vector3(0, 1, 0), degToRad(-10 + getRandom(20)))
                                .add(this.getPosition()) // TODO set y to terrain height at this position?
                            if (surfJob.surface.surfaceType === SurfaceType.CRYSTAL_SEAM) {
                                this.worldMgr.addCollectable(new Crystal(), vec.x, vec.z)
                                EventBus.publishEvent(new CrystalFoundEvent(vec))
                            } else if (surfJob.surface.surfaceType === SurfaceType.ORE_SEAM) {
                                this.worldMgr.addCollectable(new Ore(), vec.x, vec.z)
                                EventBus.publishEvent(new OreFoundEvent())
                            }
                            this.changeActivity(RaiderActivity.Stand)
                        } else {
                            this.completeJob()
                        }
                    }, drillTimeMs)
                }
            } else if (surfaceJobType === SurfaceJobType.CLEAR_RUBBLE) {
                if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                    this.moveToTarget(this.job.getPosition())
                } else {
                    if (!this.jobSubPos) {
                        const [x, z] = surfJob.surface.getRandomPosition()
                        this.jobSubPos = new Vector3(x, this.worldMgr.getTerrainHeight(x, z), z)
                    }
                    if (this.jobSubPos.distanceTo(this.getPosition()) > this.getSpeed()) {
                        this.moveToTarget(this.jobSubPos)
                    } else {
                        this.changeActivity(RaiderActivity.Clear, () => {
                            this.job.onJobComplete()
                            if (surfJob.surface.hasRubble()) {
                                this.jobSubPos = null
                            } else {
                                this.stopJob()
                            }
                        })
                    }
                }
            } else if (surfaceJobType === SurfaceJobType.REINFORCE) {
                if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                    this.moveToTarget(this.job.getPosition())
                } else {
                    this.changeActivity(RaiderActivity.Reinforce, () => {
                        this.completeJob()
                    }, 2700)
                }
            } else if (surfaceJobType === SurfaceJobType.BLOW) {
                const bj = this.job as DynamiteJob
                if (this.carries !== bj.dynamite) {
                    this.dropItem()
                    if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                        this.moveToTarget(this.job.getPosition())
                    } else {
                        this.changeActivity(RaiderActivity.Collect, () => {
                            this.pickupItem(bj.dynamite)
                        })
                    }
                } else if (!this.carryTarget) {
                    this.carryTarget = bj.surface.getDigPositions()[0]
                } else if (this.getPosition().distanceTo(this.carryTarget) > JOB_ACTION_RANGE) {
                    this.moveToTarget(this.carryTarget)
                } else {
                    this.changeActivity(RaiderActivity.Place, () => {
                        this.dropItem()
                        this.completeJob()
                    })
                }
            }
        } else if (this.job.type === JobType.CARRY) {
            const carryJob = this.job as CollectJob
            if (this.carries !== carryJob.item) {
                this.dropItem()
                if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                    this.moveToTarget(this.job.getPosition())
                } else {
                    this.changeActivity(RaiderActivity.Collect, () => {
                        this.pickupItem(carryJob.item)
                    })
                }
            } else if (!this.carryTarget) {
                this.carryTarget = this.carries.getTargetPos()
                if (!this.carryTarget) {
                    this.dropItem()
                    this.stopJob()
                }
            } else if (this.getPosition().distanceTo(this.carryTarget) > JOB_ACTION_RANGE) {
                this.moveToTarget(this.carryTarget)
            } else {
                this.changeActivity(RaiderActivity.Place, () => {
                    this.dropItem()
                    this.completeJob()
                })
            }
        } else if (this.job.type === JobType.MOVE) {
            if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                this.moveToTarget(this.job.getPosition())
            } else {
                this.changeActivity(RaiderActivity.Stand, () => {
                    this.completeJob()
                })
            }
        } else if (this.job.type === JobType.TRAIN) {
            if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                this.moveToTarget(this.job.getPosition())
            } else {
                const trainJob = this.job as TrainJob
                this.changeActivity(RaiderActivity.Train, () => {
                    this.skills.push(trainJob.skill)
                    EventBus.publishEvent(new RaiderTrained(this, trainJob.skill))
                    this.completeJob()
                }, 10000) // XXX adjust training time
            }
        } else if (this.job.type === JobType.GET_TOOL) {
            if (!this.job.isInArea(this.group.position.x, this.group.position.z)) {
                this.moveToTarget(this.job.getPosition())
            } else {
                this.tools.push((this.job as GetToolJob).tool)
                this.completeJob()
            }
        } else if (this.job.type === JobType.EAT) {
            this.changeActivity(RaiderActivity.Eat, () => {
                // TODO implement endurance fill eat level
                this.completeJob()
            })
        }
    }

    private completeJob() {
        this.job.onJobComplete()
        if (this.job) this.job.unassign(this)
        this.jobSubPos = null
        this.carryTarget = null
        this.job = this.followUpJob
        this.followUpJob = null
        this.changeActivity(RaiderActivity.Stand)
    }

    getStandActivity(): BaseActivity {
        return this.carries ? RaiderActivity.CarryStand : RaiderActivity.Stand
    }

    beamUp() {
        this.stopJob()
        this.dropItem()
        super.beamUp()
    }

    removeFromScene() {
        super.removeFromScene()
        removeFromArray(GameState.raiders, this)
    }

    hasTool(tool: RaiderTool) {
        return this.tools.indexOf(tool) !== -1
    }

    hasSkill(skill: RaiderSkill) {
        return this.skills.indexOf(skill) !== -1
    }

}
