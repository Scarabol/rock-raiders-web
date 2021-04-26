import { MathUtils, Vector2, Vector3 } from 'three'
import { getRandom, getRandomInclusive } from '../../core/Util'
import { EventBus } from '../../event/EventBus'
import { RaiderSelected, SelectionEvent } from '../../event/LocalEvents'
import { EntityAddedEvent, EntityType, OreFoundEvent, RaiderTrained } from '../../event/WorldEvents'
import { CrystalFoundEvent, RaiderDiscoveredEvent } from '../../event/WorldLocationEvent'
import { GameState } from '../../game/model/GameState'
import { CollectJob } from '../../game/model/job/CollectJob'
import { GetToolJob } from '../../game/model/job/GetToolJob'
import { JobType } from '../../game/model/job/JobType'
import { ClearRubbleJob } from '../../game/model/job/surface/ClearRubbleJob'
import { DrillJob } from '../../game/model/job/surface/DrillJob'
import { DynamiteJob } from '../../game/model/job/surface/DynamiteJob'
import { TrainJob } from '../../game/model/job/TrainJob'
import { SelectionType } from '../../game/model/Selectable'
import { ResourceManager } from '../../resource/ResourceManager'
import { BaseActivity } from './activities/BaseActivity'
import { RaiderActivity } from './activities/RaiderActivity'
import { Crystal } from './collect/Crystal'
import { Ore } from './collect/Ore'
import { CollectPathTarget } from './CollectPathTarget'
import { FulfillerEntity } from './FulfillerEntity'
import { SurfaceType } from './map/SurfaceType'
import { TerrainPath } from './map/TerrainPath'
import { MoveState } from './MoveState'
import { PathTarget } from './PathTarget'
import { RaiderSkill } from './RaiderSkill'
import { RaiderTool } from './RaiderTool'
import degToRad = MathUtils.degToRad

export class Raider extends FulfillerEntity {

    tools: RaiderTool[] = []
    skills: RaiderSkill[] = []
    slipped: boolean = false

    constructor() {
        super(SelectionType.PILOT, 'mini-figures/pilot/pilot.ae')
        this.tools = [RaiderTool.DRILL]
        this.skills = []
        this.pickSphereRadius = this.stats.PickSphere / 2
    }

    get stats() {
        return ResourceManager.stats.Pilot
    }

    findPathToTarget(target: PathTarget): TerrainPath {
        return this.worldMgr.sceneManager.terrain.findPath(this.getPosition2D(), target)
    }

    onDiscover() {
        super.onDiscover()
        GameState.raidersUndiscovered.remove(this)
        GameState.raiders.push(this)
        EventBus.publishEvent(new EntityAddedEvent(EntityType.RAIDER, this))
        EventBus.publishEvent(new RaiderDiscoveredEvent(this.getPosition()))
    }

    select(): SelectionEvent {
        this.selectionFrame.visible = !this.slipped
        if (this.selected || this.slipped) return null
        this.selected = true
        this.changeActivity()
        return new RaiderSelected(this)
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

    moveToClosestTarget(target: PathTarget[]): MoveState {
        const result = super.moveToClosestTarget(target)
        if (result === MoveState.MOVED) {
            GameState.getNearbySpiders(this).some((spider) => {
                if (this.group.position.distanceToSquared(spider.group.position) < this.radiusSq + spider.radiusSq) {
                    this.slip()
                    spider.onDeath()
                    return true
                }
            })
        } else if (result === MoveState.TARGET_UNREACHABLE) {
            console.log('Entity could not move to job target, stopping job')
            this.stopJob()
        }
        return result
    }

    slip() {
        if (getRandomInclusive(0, 100) < 10) this.stopJob()
        this.dropItem()
        this.slipped = true
        this.changeActivity(RaiderActivity.Slip, () => {
            this.slipped = false
        })
    }

    moveToClosestWorkplace(): boolean {
        return this.moveToClosestTarget(this.jobWorkplaces) === MoveState.TARGET_REACHED
    }

    work() {
        if (!this.job || this.selected || this.slipped) return
        if (this.job.type === JobType.DRILL) {
            const surfJob = this.job as DrillJob
            if (this.moveToClosestWorkplace()) {
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
                        const vec = new Vector2().copy(this.getPosition2D()).sub(surfJob.surface.getCenterWorld2D())
                            .multiplyScalar(0.3 + getRandom(3) / 10)
                            .rotateAround(new Vector2(0, 0), degToRad(-10 + getRandom(20)))
                            .add(this.getPosition2D())
                        if (surfJob.surface.surfaceType === SurfaceType.CRYSTAL_SEAM) {
                            const crystal = this.worldMgr.addCollectable(new Crystal(), vec)
                            EventBus.publishEvent(new CrystalFoundEvent(crystal.getPosition()))
                        } else if (surfJob.surface.surfaceType === SurfaceType.ORE_SEAM) {
                            this.worldMgr.addCollectable(new Ore(), vec)
                            EventBus.publishEvent(new OreFoundEvent())
                        }
                        this.changeActivity()
                    } else {
                        this.completeJob()
                    }
                }, drillTimeMs)
            }
        } else if (this.job.type === JobType.CLEAR_RUBBLE) {
            const surfJob = this.job as ClearRubbleJob
            if (this.moveToClosestWorkplace()) {
                this.changeActivity(RaiderActivity.Clear, () => {
                    this.changeActivity()
                    this.job.onJobComplete()
                    this.jobWorkplaces = this.job.getWorkplaces()
                    if (!surfJob.surface.hasRubble()) this.stopJob()
                })
            }
        } else if (this.job.type === JobType.REINFORCE) {
            if (this.moveToClosestWorkplace()) {
                this.changeActivity(RaiderActivity.Reinforce, () => {
                    this.completeJob()
                }, 2700)
            }
        } else if (this.job.type === JobType.BLOW) {
            const bj = this.job as DynamiteJob
            if (this.carries !== bj.dynamite) {
                this.dropItem()
                if (this.moveToClosestWorkplace()) {
                    this.changeActivity(RaiderActivity.Collect, () => {
                        this.pickupItem(bj.dynamite)
                    })
                }
            } else if (this.moveToClosestTarget(bj.surface.getDigPositions().map((p) => new PathTarget(p)))) {
                this.changeActivity(RaiderActivity.Place, () => {
                    this.completeJob()
                })
            }
        } else if (this.job.type === JobType.COLLECT) {
            const collectJob = this.job as CollectJob
            const collectJobItem = collectJob.item
            if (this.carries !== collectJobItem) {
                this.dropItem()
                if (this.moveToClosestWorkplace()) {
                    this.changeActivity(RaiderActivity.Collect, () => {
                        this.pickupItem(collectJobItem)
                    })
                }
            } else {
                const moveResult = this.moveToClosestTarget(collectJobItem.getCarryTargets())
                collectJobItem.setTargetSite((this.currentPath?.target as CollectPathTarget)?.site)
                if (moveResult) {
                    const collectPathTarget = this.currentPath?.target as CollectPathTarget
                    if (collectPathTarget?.canGatherItem()) {
                        const dropAction = collectPathTarget.getDropAction()
                        this.changeActivity(dropAction, () => {
                            this.completeJob()
                            collectPathTarget.gatherItem(collectJobItem)
                            // TODO move to primary path surface
                        })
                    } else {
                        this.changeActivity()
                    }
                }
            }
        } else if (this.job.type === JobType.MOVE) {
            if (this.moveToClosestWorkplace()) {
                this.changeActivity(this.getDefaultActivity(), () => {
                    this.completeJob()
                })
            }
        } else if (this.job.type === JobType.TRAIN) {
            const trainJob = this.job as TrainJob
            if (this.moveToClosestWorkplace()) {
                this.changeActivity(RaiderActivity.Train, () => {
                    this.skills.push(trainJob.skill)
                    EventBus.publishEvent(new RaiderTrained(this, trainJob.skill))
                    this.completeJob()
                }, 10000) // XXX adjust training time
            }
        } else if (this.job.type === JobType.GET_TOOL) {
            if (this.moveToClosestWorkplace()) {
                this.tools.push((this.job as GetToolJob).tool)
                this.completeJob()
            }
        } else if (this.job.type === JobType.EAT) {
            this.changeActivity(RaiderActivity.Eat, () => {
                // TODO implement endurance fill eat level
                this.completeJob()
            })
        } else if (this.job.type === JobType.COMPLETE_POWER_PATH) {
            if (this.moveToClosestWorkplace()) {
                this.changeActivity(RaiderActivity.Clear, () => {
                    this.completeJob()
                })
            }
        }
    }

    private completeJob() {
        this.dropItem()
        this.job.onJobComplete()
        if (this.job) this.job.unassign(this)
        this.job = this.followUpJob
        this.followUpJob = null
        this.jobWorkplaces = this.job?.getWorkplaces() || []
        this.changeActivity()
    }

    getDefaultActivity(): BaseActivity {
        return this.carries ? RaiderActivity.CarryStand : super.getDefaultActivity()
    }

    beamUp() {
        this.stopJob()
        super.beamUp()
    }

    removeFromScene() {
        super.removeFromScene()
        GameState.raiders.remove(this)
    }

    hasTool(tool: RaiderTool) {
        return this.tools.indexOf(tool) !== -1
    }

    hasSkill(skill: RaiderSkill) {
        return this.skills.indexOf(skill) !== -1
    }

}
