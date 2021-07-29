import { PositionalAudio } from 'three'
import { resetAudioSafe } from '../../../audio/AudioUtil'
import { VehicleEntityStats } from '../../../cfg/VehicleEntityStats'
import { EventBus } from '../../../event/EventBus'
import { SelectionChanged } from '../../../event/LocalEvents'
import { VehicleSceneEntity } from '../../../scene/entities/VehicleSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { AnimEntityActivity } from '../activities/AnimEntityActivity'
import { EntityType } from '../EntityType'
import { FulfillerEntity } from '../FulfillerEntity'
import { Job } from '../job/Job'
import { ManVehicleJob } from '../job/ManVehicleJob'
import { MoveJob } from '../job/raider/MoveJob'
import { Crystal } from '../material/Crystal'
import { MaterialEntity } from '../material/MaterialEntity'
import { Ore } from '../material/Ore'
import { MoveState } from '../MoveState'
import { Raider } from '../raider/Raider'
import { RaiderTool } from '../raider/RaiderTool'
import { RaiderTraining } from '../raider/RaiderTraining'

export class VehicleEntity extends FulfillerEntity {
    stats: VehicleEntityStats
    sceneEntity: VehicleSceneEntity
    driver: Raider = null
    callManJob: ManVehicleJob = null
    engineSound: PositionalAudio = null
    carriedItems: Set<MaterialEntity> = new Set()

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager, entityType: EntityType, stats: VehicleEntityStats, sceneEntity: VehicleSceneEntity) {
        super(sceneMgr, entityMgr, entityType)
        this.stats = stats
        this.sceneEntity = sceneEntity
        this.sceneEntity.speed = this.getSpeed() // TODO update speed on entity upgrade
    }

    beamUp() {
        this.dropDriver()
        super.beamUp()
        const surface = this.sceneEntity.surfaces[0]
        for (let c = 0; c < this.stats.CostOre; c++) {
            this.entityMgr.placeMaterial(new Ore(this.sceneMgr, this.entityMgr), surface.getRandomPosition())
        }
        for (let c = 0; c < this.stats.CostCrystal; c++) {
            this.entityMgr.placeMaterial(new Crystal(this.sceneMgr, this.entityMgr), surface.getRandomPosition())
        }
        this.entityMgr.vehicles.remove(this)
        this.entityMgr.vehiclesInBeam.add(this)
    }

    disposeFromWorld() {
        super.disposeFromWorld()
        this.entityMgr.vehicles.remove(this)
        this.entityMgr.vehiclesUndiscovered.remove(this)
        this.entityMgr.vehiclesInBeam.remove(this)
    }

    setJob(job: Job, followUpJob: Job = null) {
        if (!this.driver) return
        super.setJob(job, followUpJob)
    }

    grabJobItem(elapsedMs: number, carryItem: MaterialEntity): boolean {
        if (this.carriedItems.has(carryItem)) return true
        if (this.moveToClosestTarget(carryItem.getPositionAsPathTargets(), elapsedMs) === MoveState.TARGET_REACHED) {
            this.sceneEntity.changeActivity(AnimEntityActivity.Stand, () => {
                this.carriedItems.add(carryItem)
                this.sceneEntity.pickupEntity(carryItem.sceneEntity)
            })
        }
        return false
    }

    dropCarried() {
        if (this.carriedItems.size < 1) return
        this.sceneEntity.dropAllEntities()
        this.carriedItems.clear()
    }

    addDriver(driver: Raider) {
        this.driver = driver
        this.driver.vehicle = this
        if (!this.stats.InvisibleDriver) {
            this.sceneEntity.addDriver(this.driver.sceneEntity)
        } else {
            this.driver.sceneEntity.disposeFromScene()
        }
        if (this.stats.EngineSound && !this.engineSound) this.engineSound = this.sceneEntity.playPositionalAudio(this.stats.EngineSound, true)
        if (this.selected) EventBus.publishEvent(new SelectionChanged(this.entityMgr))
    }

    dropDriver() {
        this.stopJob()
        if (!this.driver) return
        this.sceneEntity.removeDriver()
        this.driver.vehicle = null
        this.driver.sceneEntity.addToScene(this.sceneEntity.position2D, this.sceneEntity.getHeading())
        this.driver.sceneEntity.changeActivity()
        this.driver = null
        this.engineSound = resetAudioSafe(this.engineSound)
        if (this.selected) EventBus.publishEvent(new SelectionChanged(this.entityMgr))
    }

    getRequiredTraining(): RaiderTraining {
        if (this.stats.CrossLand && !this.stats.CrossLava && !this.stats.CrossWater) {
            return RaiderTraining.DRIVER
        } else if (this.stats.CrossWater) {
            return RaiderTraining.SAILOR
        }
        return RaiderTraining.PILOT
    }

    isPrepared(job: Job): boolean {
        const carryType = job.getCarryItem()?.entityType
        return this.canDrill(job.surface) || (job.getRequiredTool() === RaiderTool.SHOVEL && this.canClear()) ||
            ((carryType === EntityType.ORE || carryType === EntityType.CRYSTAL || carryType === EntityType.ELECTRIC_FENCE) && this.hasCapacity())
    }

    doubleSelect(): boolean {
        if (!this.selected || !this.stats.CanDoubleSelect || !this.driver) return false
        this.sceneEntity.selectionFrame.visible = false
        this.sceneEntity.selectionFrameDouble.visible = true
        return true
    }

    canClear(): boolean {
        return !!this.stats.CanClearRubble
    }

    hasCapacity(): boolean {
        return this.carriedItems.size < this.getCarryCapacity()
    }

    getSpeed(): number {
        return this.stats.RouteSpeed[this.level]
    }

    isReadyToTakeAJob(): boolean {
        return super.isReadyToTakeAJob() && !!this.driver
    }

    getCarryCapacity(): number {
        return this.stats.MaxCarry?.[this.level] || 0
    }

    unblockTeleporter() {
        const blockedTeleporter = this.sceneEntity.surfaces.find((s) => !!s.building?.teleport && s.building?.primaryPathSurface === s)
        if (blockedTeleporter) {
            const walkableNeighbor = blockedTeleporter.neighbors.find((n) => !n.site && n.isWalkable() && !n.building?.teleport)
            if (walkableNeighbor) this.setJob(new MoveJob(walkableNeighbor.getCenterWorld2D()))
        }
    }
}
