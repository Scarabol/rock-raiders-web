import { MathUtils, Vector2, Vector3 } from 'three'
import { getRandom, getRandomInclusive } from '../../../core/Util'
import { EventBus } from '../../../event/EventBus'
import { RaiderSelected, SelectionEvent } from '../../../event/LocalEvents'
import { EntityAddedEvent, OreFoundEvent } from '../../../event/WorldEvents'
import { CrystalFoundEvent, RaiderDiscoveredEvent } from '../../../event/WorldLocationEvent'
import { ResourceManager } from '../../../resource/ResourceManager'
import { BaseActivity } from '../activities/BaseActivity'
import { RaiderActivity } from '../activities/RaiderActivity'
import { CarryPathTarget } from '../collect/CarryPathTarget'
import { Crystal } from '../collect/Crystal'
import { Ore } from '../collect/Ore'
import { EntitySuperType, EntityType } from '../EntityType'
import { FulfillerEntity } from '../FulfillerEntity'
import { GameState } from '../GameState'
import { GetToolJob } from '../job/GetToolJob'
import { JobType } from '../job/JobType'
import { ClearRubbleJob } from '../job/surface/ClearRubbleJob'
import { DrillJob } from '../job/surface/DrillJob'
import { SurfaceType } from '../map/SurfaceType'
import { TerrainPath } from '../map/TerrainPath'
import { MoveState } from '../MoveState'
import { PathTarget } from '../PathTarget'
import { SelectionType } from '../Selectable'
import { RaiderTool } from './RaiderTool'
import { RaiderTraining } from './RaiderTraining'
import degToRad = MathUtils.degToRad

export class Raider extends FulfillerEntity {

    tools: Map<RaiderTool, boolean> = new Map()
    trainings: Map<RaiderTraining, boolean> = new Map()
    slipped: boolean = false

    constructor() {
        super(EntitySuperType.RAIDER, EntityType.PILOT, 'mini-figures/pilot/pilot.ae', SelectionType.RAIDER)
        this.tools.set(RaiderTool.DRILL, true)
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
        EventBus.publishEvent(new EntityAddedEvent(this))
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
        this.job.setActualWorkplace(this.currentPath?.target)
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
            if (this.moveToClosestWorkplace()) {
                const surfJob = this.job as DrillJob
                let drillTimeMs = this.getDrillTime(surfJob.surface.surfaceType)
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
                            const crystal = this.worldMgr.placeMaterial(new Crystal(), vec)
                            EventBus.publishEvent(new CrystalFoundEvent(crystal.getPosition()))
                        } else if (surfJob.surface.surfaceType === SurfaceType.ORE_SEAM) {
                            this.worldMgr.placeMaterial(new Ore(), vec)
                            EventBus.publishEvent(new OreFoundEvent())
                        }
                        this.changeActivity()
                    } else {
                        this.completeJob()
                    }
                }, drillTimeMs)
            }
        } else if (this.job.type === JobType.CLEAR_RUBBLE) {
            if (this.moveToClosestWorkplace()) {
                this.changeActivity(RaiderActivity.Clear, () => {
                    this.changeActivity()
                    this.job.onJobComplete()
                    this.jobWorkplaces = this.job.getWorkplaces()
                    const surface = (this.job as ClearRubbleJob).surface
                    if (!surface.hasRubble()) this.stopJob()
                })
            }
        } else if (this.job.type === JobType.REINFORCE) {
            if (this.moveToClosestWorkplace()) {
                this.changeActivity(RaiderActivity.Reinforce, () => {
                    this.completeJob()
                }, 2700)
            }
        } else if (this.job.type === JobType.CARRY) {
            const materialEntity = this.job.getCarryItem()
            if (this.carries !== materialEntity) {
                this.dropItem()
                if (this.moveToClosestTarget([new PathTarget(materialEntity.getPosition2D())])) { // XXX cache item path target
                    this.changeActivity(RaiderActivity.Collect, () => {
                        this.pickupItem(materialEntity)
                    })
                }
            } else {
                if (this.moveToClosestWorkplace()) {
                    const collectPathTarget = this.currentPath?.target as CarryPathTarget
                    if (collectPathTarget?.canGatherItem()) {
                        const dropAction = collectPathTarget.getDropAction()
                        this.changeActivity(dropAction, () => {
                            this.completeJob()
                            collectPathTarget.gatherItem(materialEntity)
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
            if (this.moveToClosestWorkplace()) {
                this.changeActivity(RaiderActivity.Train, () => {
                    this.completeJob()
                }, 10000) // XXX adjust training time
            }
        } else if (this.job.type === JobType.GET_TOOL) {
            if (this.moveToClosestWorkplace()) {
                const tool = (this.job as GetToolJob).tool
                this.addTool(tool)
                this.completeJob()
            }
        } else if (this.job.type === JobType.EAT) {
            this.changeActivity(RaiderActivity.Eat, () => {
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

    private getDrillTime(surfaceType: SurfaceType) {
        let drillTimeMs = null
        if (surfaceType === SurfaceType.HARD_ROCK) {
            drillTimeMs = this.stats.HardDrillTime[this.level] * 1000
        } else if (surfaceType === SurfaceType.LOOSE_ROCK) {
            drillTimeMs = this.stats.LooseDrillTime[this.level] * 1000
        } else if (surfaceType === SurfaceType.DIRT) {
            drillTimeMs = this.stats.SoilDrillTime[this.level] * 1000
        } else if (surfaceType === SurfaceType.ORE_SEAM ||
            surfaceType === SurfaceType.CRYSTAL_SEAM) {
            drillTimeMs = this.stats.SeamDrillTime[this.level] * 1000
        }
        drillTimeMs = drillTimeMs || 0
        if (!drillTimeMs) console.warn('According to cfg this entity cannot drill this material')
        return drillTimeMs
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
        return !tool || this.tools.has(tool)
    }

    hasTraining(training: RaiderTraining) {
        return !training || this.trainings.has(training)
    }

    addTool(tool: RaiderTool) {
        this.tools.set(tool, true)
    }

    addTraining(training: RaiderTraining) {
        this.trainings.set(training, true)
    }

}
