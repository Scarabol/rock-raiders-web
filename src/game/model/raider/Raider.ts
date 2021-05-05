import { Vector3 } from 'three'
import { getRandomInclusive } from '../../../core/Util'
import { EventBus } from '../../../event/EventBus'
import { RaiderSelected, SelectionEvent } from '../../../event/LocalEvents'
import { EntityAddedEvent } from '../../../event/WorldEvents'
import { RaiderDiscoveredEvent } from '../../../event/WorldLocationEvent'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { BaseActivity } from '../activities/BaseActivity'
import { RaiderActivity } from '../activities/RaiderActivity'
import { EntitySuperType, EntityType } from '../EntityType'
import { FulfillerEntity } from '../FulfillerEntity'
import { GameState } from '../GameState'
import { JobState } from '../job/JobState'
import { TerrainPath } from '../map/TerrainPath'
import { MoveState } from '../MoveState'
import { PathTarget } from '../PathTarget'
import { SelectionType } from '../Selectable'
import { RaiderTool } from './RaiderTool'
import { RaiderTraining } from './RaiderTraining'

export class Raider extends FulfillerEntity {

    tools: Map<RaiderTool, boolean> = new Map()
    trainings: Map<RaiderTraining, boolean> = new Map()
    slipped: boolean = false

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntitySuperType.RAIDER, EntityType.PILOT, 'mini-figures/pilot/pilot.ae', SelectionType.RAIDER)
        this.tools.set(RaiderTool.DRILL, true)
    }

    get stats() {
        return ResourceManager.stats.Pilot
    }

    findPathToTarget(target: PathTarget): TerrainPath {
        return this.sceneMgr.terrain.findPath(this.getPosition2D(), target)
    }

    onDiscover() {
        super.onDiscover()
        GameState.raidersUndiscovered.remove(this)
        GameState.raiders.push(this)
        EventBus.publishEvent(new EntityAddedEvent(this))
        EventBus.publishEvent(new RaiderDiscoveredEvent(this))
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

    getSpeed(): number {
        return super.getSpeed() * this.stats.RouteSpeed[this.level] * (this.isOnPath() ? this.stats.PathCoef : 1)
    }

    isOnPath(): boolean {
        return this.sceneMgr.terrain.getSurfaceFromWorld(this.group.position).isPath()
    }

    isOnRubble() {
        return this.sceneMgr.terrain.getSurfaceFromWorld(this.group.position).hasRubble()
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
        if (this.job.jobstate !== JobState.INCOMPLETE) {
            this.stopJob()
        } else {
            const carryItem = this.job.getCarryItem()
            if (carryItem && this.carries !== carryItem) {
                this.dropItem()
                if (this.moveToClosestTarget(carryItem.getPositionPathTarget())) {
                    this.changeActivity(RaiderActivity.Collect, () => {
                        this.pickupItem(carryItem)
                    })
                }
            } else if (this.moveToClosestWorkplace()) {
                if (this.job.isReadyToComplete()) {
                    const workActivity = this.job.getWorkActivity() || this.getDefaultActivity()
                    this.changeActivity(workActivity, () => {
                        this.completeJob()
                    }, this.job.getWorkDuration(this))
                } else {
                    this.changeActivity()
                }
            }
        }
    }

    private completeJob() {
        this.job?.onJobComplete()
        if (this.job?.jobstate === JobState.INCOMPLETE) return
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
