import { getRandomInclusive } from '../../../core/Util'
import { EventBus } from '../../../event/EventBus'
import { RaidersChangedEvent } from '../../../event/LocalEvents'
import { RaiderDiscoveredEvent } from '../../../event/WorldLocationEvent'
import { ResourceManager } from '../../../resource/ResourceManager'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { AnimEntityActivity } from '../activities/AnimEntityActivity'
import { BaseActivity } from '../activities/BaseActivity'
import { RaiderActivity } from '../activities/RaiderActivity'
import { EntityType } from '../EntityType'
import { FulfillerEntity } from '../FulfillerEntity'
import { Job } from '../job/Job'
import { TerrainPath } from '../map/TerrainPath'
import { MoveState } from '../MoveState'
import { PathTarget } from '../PathTarget'
import { SelectionType } from '../Selectable'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { RaiderTool } from './RaiderTool'
import { RaiderTraining } from './RaiderTraining'

export class Raider extends FulfillerEntity {

    tools: Map<RaiderTool, boolean> = new Map()
    trainings: Map<RaiderTraining, boolean> = new Map()
    slipped: boolean = false
    radiusSq: number = 0
    hungerLevel: number = 1
    vehicle: VehicleEntity = null

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.PILOT, 'mini-figures/pilot/pilot.ae')
        this.tools.set(RaiderTool.DRILL, true)
    }

    get stats() {
        return ResourceManager.stats.Pilot
    }

    findPathToTarget(target: PathTarget): TerrainPath {
        return this.sceneMgr.terrain.findWalkPath(this.getPosition2D(), target)
    }

    onDiscover() {
        super.onDiscover()
        this.entityMgr.raidersUndiscovered.remove(this)
        this.entityMgr.raiders.push(this)
        EventBus.publishEvent(new RaidersChangedEvent(this.entityMgr))
        EventBus.publishEvent(new RaiderDiscoveredEvent(this.getPosition()))
    }

    isSelectable(): boolean {
        return super.isSelectable() && !this.slipped && !this.vehicle
    }

    getSelectionType(): SelectionType {
        return SelectionType.RAIDER
    }

    isDriving(): boolean {
        return !!this.vehicle
    }

    getSpeed(): number {
        return super.getSpeed() * this.stats.RouteSpeed[this.level] * (this.isOnPath() ? this.stats.PathCoef : 1)
    }

    isOnPath(): boolean {
        return this.sceneMgr.terrain.getSurfaceFromWorld(this.sceneEntity.position).isPath()
    }

    isOnRubble() {
        return this.sceneMgr.terrain.getSurfaceFromWorld(this.sceneEntity.position).hasRubble()
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
            this.entityMgr.spiders.some((spider) => { // TODO optimize this with a quad tree or similar
                if (this.sceneEntity.position.distanceToSquared(spider.sceneEntity.position) < this.radiusSq + spider.radiusSq) {
                    this.slip()
                    spider.onDeath()
                    return true
                }
            })
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

    work() {
        if (this.slipped) return
        super.work()
    }

    getDefaultActivity(): BaseActivity {
        return this.carries ? RaiderActivity.CarryStand : super.getDefaultActivity()
    }

    beamUp() {
        super.beamUp()
        EventBus.publishEvent(new RaidersChangedEvent(this.entityMgr))
    }

    removeFromScene() {
        super.removeFromScene()
        this.entityMgr.raiders.remove(this)
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

    isPrepared(job: Job): boolean {
        return this.hasTool(job.getRequiredTool()) && this.hasTraining(job.getRequiredTraining())
    }

    changeActivity(activity: AnimEntityActivity = this.getDefaultActivity(), onAnimationDone: () => any = null, durationTimeMs: number = null) {
        super.changeActivity(activity, onAnimationDone, durationTimeMs)
        this.radiusSq = this.sceneEntity.getRadiusSquare()
    }

}
