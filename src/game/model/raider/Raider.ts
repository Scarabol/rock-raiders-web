import { EventBus } from '../../../event/EventBus'
import { RaidersAmountChangedEvent } from '../../../event/LocalEvents'
import { RAIDER_CARRY_SLOWDOWN, SPIDER_SLIP_RANGE_SQ } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { RaiderSceneEntity } from '../../../scene/entities/RaiderSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { AnimEntityActivity } from '../activities/AnimEntityActivity'
import { BaseActivity } from '../activities/BaseActivity'
import { RaiderActivity } from '../activities/RaiderActivity'
import { FulfillerEntity } from '../FulfillerEntity'
import { Job } from '../job/Job'
import { Surface } from '../map/Surface'
import { MaterialEntity } from '../material/MaterialEntity'
import { MoveState } from '../MoveState'
import { PathTarget } from '../PathTarget'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { RaiderTool } from './RaiderTool'
import { RaiderTraining } from './RaiderTraining'
import { TerrainPath } from '../map/TerrainPath'

export class Raider extends FulfillerEntity {
    sceneEntity: RaiderSceneEntity
    tools: Map<RaiderTool, boolean> = new Map()
    trainings: Map<RaiderTraining, boolean> = new Map()
    carries: MaterialEntity = null
    slipped: boolean = false
    hungerLevel: number = 1
    vehicle: VehicleEntity = null

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr)
        this.tools.set(RaiderTool.DRILL, true)
        this.sceneEntity = new RaiderSceneEntity(sceneMgr, 'mini-figures/pilot/pilot.ae')
    }

    get stats() {
        return ResourceManager.configuration.stats.Pilot
    }

    isSelectable(): boolean {
        return super.isSelectable() && !this.slipped && !this.vehicle
    }

    isDriving(): boolean {
        return !!this.vehicle
    }

    getRouteActivity(): BaseActivity {
        if (this.isOnRubble()) {
            return !!this.carries ? RaiderActivity.CarryRubble : RaiderActivity.routeRubble
        } else {
            return !!this.carries ? RaiderActivity.Carry : AnimEntityActivity.Route
        }
    }

    moveToClosestTarget(target: PathTarget[], elapsedMs: number): MoveState {
        const result = super.moveToClosestTarget(target, elapsedMs)
        if (result === MoveState.MOVED) {
            this.entityMgr.spiders.some((spider) => { // TODO optimize this with a quad tree or similar
                if (this.sceneEntity.position.distanceToSquared(spider.position) < SPIDER_SLIP_RANGE_SQ) {
                    this.slip()
                    spider.markDead()
                    return true
                }
            })
        }
        return result
    }

    findPathToTarget(target: PathTarget): TerrainPath {
        return this.sceneMgr.terrain.pathFinder.findPath(this.sceneEntity.position2D, target, this.stats, true)
    }

    slip() {
        if (Math.randomInclusive(0, 100) < 10) this.stopJob()
        this.dropCarried()
        this.slipped = true
        this.sceneEntity.changeActivity(RaiderActivity.Slip, () => {
            this.slipped = false
        })
    }

    work(elapsedMs: number) {
        if (this.slipped) return
        if (this.vehicle) {
            this.sceneEntity.changeActivity(this.vehicle.getDriverActivity())
        } else {
            super.work(elapsedMs)
        }
    }

    grabJobItem(elapsedMs: number, carryItem: MaterialEntity): boolean {
        if (this.carries === carryItem) return true
        this.dropCarried()
        if (this.moveToClosestTarget(carryItem.getPositionAsPathTargets(), elapsedMs) === MoveState.TARGET_REACHED) {
            this.sceneEntity.changeActivity(RaiderActivity.Collect, () => {
                this.carries = carryItem
                this.sceneEntity.pickupEntity(carryItem.sceneEntity)
            })
        }
        return false
    }

    stopJob() {
        this.dropCarried()
        super.stopJob()
    }

    dropCarried(): void {
        if (!this.carries) return
        this.sceneEntity.dropAllEntities()
        this.carries = null
    }

    beamUp() {
        super.beamUp()
        EventBus.publishEvent(new RaidersAmountChangedEvent(this.entityMgr))
    }

    disposeFromWorld() {
        super.disposeFromWorld()
        this.entityMgr.raiders.remove(this)
        this.entityMgr.raidersUndiscovered.remove(this)
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
        if (job.getRequiredTool() === RaiderTool.DRILL) return this.canDrill(job.surface)
        return this.hasTool(job.getRequiredTool()) && this.hasTraining(job.getRequiredTraining()) && this.hasCapacity()
    }

    canDrill(surface: Surface): boolean {
        return super.canDrill(surface) && this.hasTool(RaiderTool.DRILL)
    }

    hasCapacity(): boolean {
        return !this.carries
    }

    isReadyToTakeAJob(): boolean {
        return super.isReadyToTakeAJob() && !this.slipped
    }

    getSpeed(): number {
        return super.getSpeed() * (!!this.carries ? RAIDER_CARRY_SLOWDOWN : 1)
    }
}
