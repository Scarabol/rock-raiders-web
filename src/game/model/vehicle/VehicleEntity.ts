import { PositionalAudio } from 'three'
import { resetAudioSafe } from '../../../audio/AudioUtil'
import { VehicleEntityStats } from '../../../cfg/VehicleEntityStats'
import { EventBus } from '../../../event/EventBus'
import { SelectionChanged } from '../../../event/LocalEvents'
import { VehicleSceneEntity } from '../../../scene/entities/VehicleSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { FulfillerEntity } from '../FulfillerEntity'
import { Job } from '../job/Job'
import { ManVehicleJob } from '../job/ManVehicleJob'
import { Crystal } from '../material/Crystal'
import { Ore } from '../material/Ore'
import { Raider } from '../raider/Raider'
import { RaiderTraining } from '../raider/RaiderTraining'
import { VehicleActivity } from './VehicleActivity'

export abstract class VehicleEntity extends FulfillerEntity {

    sceneEntity: VehicleSceneEntity
    driver: Raider = null
    callManJob: ManVehicleJob = null
    engineSound: PositionalAudio = null

    protected constructor(sceneMgr: SceneManager, entityMgr: EntityManager, entityType: EntityType) {
        super(sceneMgr, entityMgr, entityType)
    }

    abstract get stats(): VehicleEntityStats

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
        return RaiderTraining.DRIVER
    }

    getRouteActivity(): VehicleActivity {
        return VehicleActivity.Route
    }

    isPrepared(job: Job): boolean {
        return false
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
        return !this.carries // FIXME vehicles: implement capacity for vehicle
    }

    getSpeed(): number {
        return Array.isArray(this.stats.RouteSpeed) ? this.stats.RouteSpeed[this.level] : this.stats.RouteSpeed
    }

    isReadyToTakeAJob(): boolean {
        return super.isReadyToTakeAJob() && !!this.driver
    }

}
