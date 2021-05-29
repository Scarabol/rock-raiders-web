import { getRandomInclusive } from '../../../core/Util'
import { EventBus } from '../../../event/EventBus'
import { RaidersChangedEvent } from '../../../event/LocalEvents'
import { SPIDER_SLIP_RANGE_SQ } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { FulfillerSceneEntity } from '../../../scene/entities/FulfillerSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { BaseActivity } from '../activities/BaseActivity'
import { RaiderActivity } from '../activities/RaiderActivity'
import { EntityType } from '../EntityType'
import { FulfillerEntity } from '../FulfillerEntity'
import { Job } from '../job/Job'
import { Surface } from '../map/Surface'
import { TerrainPath } from '../map/TerrainPath'
import { MoveState } from '../MoveState'
import { PathTarget } from '../PathTarget'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { RaiderTool } from './RaiderTool'
import { RaiderTraining } from './RaiderTraining'

export class Raider extends FulfillerEntity {

    tools: Map<RaiderTool, boolean> = new Map()
    trainings: Map<RaiderTraining, boolean> = new Map()
    slipped: boolean = false
    hungerLevel: number = 1
    vehicle: VehicleEntity = null

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.PILOT)
        this.tools.set(RaiderTool.DRILL, true)
        this.sceneEntity = new FulfillerSceneEntity(sceneMgr, 'mini-figures/pilot/pilot.ae')
    }

    get stats() {
        return ResourceManager.stats.Pilot
    }

    findPathToTarget(target: PathTarget): TerrainPath {
        return this.sceneMgr.terrain.findWalkPath(this.sceneEntity.position2D.clone(), target)
    }

    isSelectable(): boolean {
        return super.isSelectable() && !this.slipped && !this.vehicle
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
                if (this.sceneEntity.position.distanceToSquared(spider.sceneEntity.position) < SPIDER_SLIP_RANGE_SQ) {
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
        this.sceneEntity.changeActivity(RaiderActivity.Slip, () => {
            this.slipped = false
        })
    }

    work() {
        if (this.slipped) return
        super.work()
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

    canDrill(surface: Surface): boolean {
        return super.canDrill(surface) && this.hasTool(RaiderTool.DRILL)
    }

}
