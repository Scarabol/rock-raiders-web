import { getRandomInclusive } from '../../../core/Util'
import { EventBus } from '../../../event/EventBus'
import { RaidersChangedEvent } from '../../../event/LocalEvents'
import { SPIDER_SLIP_RANGE_SQ } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { RaiderSceneEntity } from '../../../scene/entities/RaiderSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { BaseActivity } from '../activities/BaseActivity'
import { RaiderActivity } from '../activities/RaiderActivity'
import { EntityType } from '../EntityType'
import { FulfillerEntity } from '../FulfillerEntity'
import { Job } from '../job/Job'
import { Surface } from '../map/Surface'
import { MoveState } from '../MoveState'
import { PathTarget } from '../PathTarget'
import { VehicleActivity } from '../vehicle/VehicleActivity'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { RaiderTool } from './RaiderTool'
import { RaiderTraining } from './RaiderTraining'

export class Raider extends FulfillerEntity {

    sceneEntity: RaiderSceneEntity
    tools: Map<RaiderTool, boolean> = new Map()
    trainings: Map<RaiderTraining, boolean> = new Map()
    slipped: boolean = false
    hungerLevel: number = 1
    vehicle: VehicleEntity = null

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.PILOT)
        this.tools.set(RaiderTool.DRILL, true)
        this.sceneEntity = new RaiderSceneEntity(sceneMgr, 'mini-figures/pilot/pilot.ae')
    }

    get stats() {
        return ResourceManager.stats.Pilot
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

    moveToClosestTarget(target: PathTarget[], elapsedMs: number): MoveState {
        const result = super.moveToClosestTarget(target, elapsedMs)
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

    work(elapsedMs: number) {
        if (this.slipped) return
        if (this.vehicle) {
            this.sceneEntity.changeActivity(this.getDriverActivity())
        } else {
            super.work(elapsedMs)
        }
    }

    getDriverActivity(): RaiderActivity {
        if (!this.vehicle) return RaiderActivity.Stand
        const vehicleStands = this.vehicle.sceneEntity.activity === VehicleActivity.Stand
        switch (this.vehicle.entityType) {
            case EntityType.HOVERBOARD:
                return vehicleStands ? RaiderActivity.Standhoverboard : RaiderActivity.Hoverboard
            case EntityType.SMALL_DIGGER:
                return vehicleStands ? RaiderActivity.StandSMALLDIGGER : RaiderActivity.SMALLDIGGER
            case EntityType.SMALL_TRUCK:
                return vehicleStands ? RaiderActivity.StandSMALLTRUCK : RaiderActivity.SMALLTRUCK
            case EntityType.SMALL_MLP:
                return vehicleStands ? RaiderActivity.StandSMALLMLP : RaiderActivity.SMALLMLP
            case EntityType.SMALL_CAT:
                return vehicleStands ? RaiderActivity.StandSMALLCAT : RaiderActivity.SMALLCAT
            case EntityType.SMALL_HELI:
                return vehicleStands ? RaiderActivity.StandSMALLheli : RaiderActivity.SMALLheli
            case EntityType.LARGE_CAT:
                return vehicleStands ? RaiderActivity.StandLARGECAT : RaiderActivity.LARGECAT
        }
    }

    beamUp() {
        super.beamUp()
        EventBus.publishEvent(new RaidersChangedEvent(this.entityMgr))
    }

    removeFromScene() {
        super.removeFromScene()
        this.entityMgr.raiders.remove(this)
        this.entityMgr.raidersInBeam.remove(this)
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

    isReadyToTakeAJob(): boolean {
        return !this.job && !this.selected && !this.inBeam && !this.slipped
    }

}
