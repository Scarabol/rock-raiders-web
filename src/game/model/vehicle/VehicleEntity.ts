import { PositionalAudio } from 'three'
import { resetAudioSafe } from '../../../audio/AudioUtil'
import { EventBus } from '../../../event/EventBus'
import { SelectionChanged, VehiclesChangedEvent } from '../../../event/LocalEvents'
import { FulfillerSceneEntity } from '../../../scene/entities/FulfillerSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { RaiderActivity } from '../activities/RaiderActivity'
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

    sceneEntity: FulfillerSceneEntity
    driver: Raider = null
    callManJob: ManVehicleJob = null
    engineSound: PositionalAudio

    protected constructor(sceneMgr: SceneManager, entityMgr: EntityManager, entityType: EntityType, aeFilename: string) {
        super(sceneMgr, entityMgr, entityType)
        this.sceneEntity = new FulfillerSceneEntity(sceneMgr, aeFilename)
        this.sceneEntity.flipXAxis()
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
        EventBus.publishEvent(new VehiclesChangedEvent())
    }

    setJob(job: Job, followUpJob: Job = null) {
        if (!this.driver) return
        super.setJob(job, followUpJob)
    }

    addDriver(driver: Raider) {
        this.driver = driver
        this.driver.vehicle = this
        this.driver.sceneEntity.position.set(0, 0, 0)
        this.driver.sceneEntity.setHeading(Math.PI)
        this.driver.sceneEntity.changeActivity(this.getDriverActivity())
        if (!this.stats.InvisibleDriver) {
            this.sceneEntity.animation.driverJoint.add(this.driver.sceneEntity.group)
        } else {
            this.driver.sceneEntity.removeFromScene()
        }
        if (this.stats.EngineSound && !this.engineSound) this.engineSound = this.sceneEntity.playPositionalAudio(this.stats.EngineSound, true)
        if (this.selected) EventBus.publishEvent(new SelectionChanged(this.entityMgr))
    }

    dropDriver() {
        this.stopJob()
        if (!this.driver) return
        this.sceneEntity.animation.driverJoint.remove(this.driver.sceneEntity.group)
        this.driver.vehicle = null
        this.driver.sceneEntity.position.copy(this.sceneEntity.position)
        this.driver.sceneEntity.setHeading(this.sceneEntity.getHeading())
        this.driver.sceneMgr.scene.add(this.driver.sceneEntity.group)
        this.driver.sceneEntity.changeActivity()
        this.driver = null
        this.engineSound = resetAudioSafe(this.engineSound)
        if (this.selected) EventBus.publishEvent(new SelectionChanged(this.entityMgr))
    }

    getRequiredTraining(): RaiderTraining {
        return RaiderTraining.DRIVER
    }

    getDriverActivity(): RaiderActivity {
        return RaiderActivity.Stand
    }

    getRouteActivity(): VehicleActivity {
        return VehicleActivity.Route
    }

    isPrepared(job: Job): boolean {
        return false
    }

}
