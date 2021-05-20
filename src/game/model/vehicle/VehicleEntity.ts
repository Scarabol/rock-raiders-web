import { PositionalAudio, Vector2 } from 'three'
import { EventBus } from '../../../event/EventBus'
import { VehiclesChangedEvent } from '../../../event/LocalEvents'
import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { AnimEntityActivity } from '../activities/AnimEntityActivity'
import { RaiderActivity } from '../activities/RaiderActivity'
import { Crystal } from '../collect/Crystal'
import { Ore } from '../collect/Ore'
import { EntityType } from '../EntityType'
import { FulfillerEntity } from '../FulfillerEntity'
import { Job } from '../job/Job'
import { VehicleCallManJob } from '../job/VehicleCallManJob'
import { TerrainPath } from '../map/TerrainPath'
import { PathTarget } from '../PathTarget'
import { Raider } from '../raider/Raider'
import { RaiderTool } from '../raider/RaiderTool'
import { RaiderTraining } from '../raider/RaiderTraining'
import { SelectionType } from '../Selectable'
import { VehicleActivity } from './VehicleActivity'

export abstract class VehicleEntity extends FulfillerEntity {

    driver: Raider = null
    callManJob: VehicleCallManJob = null
    engineSound: PositionalAudio

    protected constructor(worldMgr: WorldManager, sceneMgr: SceneManager, entityType: EntityType, aeFilename: string) {
        super(worldMgr, sceneMgr, entityType, aeFilename)
        this.sceneEntity.flipXAxis()
        this.sceneEntity.setSelectable(this)
    }

    findPathToTarget(target: PathTarget): TerrainPath {
        return this.sceneMgr.terrain.findDrivePath(this.getPosition2D(), target)
    }

    getSelectionType(): SelectionType {
        return this.driver ? SelectionType.VEHICLE_MANED : SelectionType.VEHICLE_EMPTY
    }

    beamUp() {
        this.dropDriver()
        super.beamUp()
        const surface = this.surfaces[0]
        for (let c = 0; c < this.stats.CostOre; c++) {
            this.worldMgr.placeMaterial(new Ore(this.worldMgr, this.sceneMgr), surface.getRandomPosition())
        }
        for (let c = 0; c < this.stats.CostCrystal; c++) {
            this.worldMgr.placeMaterial(new Crystal(this.worldMgr, this.sceneMgr), surface.getRandomPosition())
        }
        EventBus.publishEvent(new VehiclesChangedEvent())
    }

    setJob(job: Job, followUpJob: Job = null) {
        if (!this.driver) return
        super.setJob(job, followUpJob)
    }

    addDriver(driver: Raider) {
        this.driver = driver
        this.driver.changeActivity(this.getDriverActivity())
        this.sceneEntity.add(this.driver.sceneEntity.group) // TODO add driver to driver joint
        if (this.stats.EngineSound && !this.engineSound) this.engineSound = this.playPositionalSfxName(this.stats.EngineSound, true)
    }

    dropDriver() {
        this.stopJob()
        if (!this.driver) return
        this.sceneEntity.remove(this.driver.sceneEntity.group) // TODO remove driver from driver joint
        this.driver.sceneEntity.position.copy(this.sceneEntity.position)
        this.driver.sceneEntity.setHeading(this.sceneEntity.getHeading())
        this.driver.sceneMgr.scene.add(this.driver.sceneEntity.group)
        this.driver.changeActivity()
        this.driver = null
        this.engineSound?.stop()
        this.engineSound = null
    }

    getRequiredTraining(): RaiderTraining {
        return RaiderTraining.DRIVER
    }

    getDriverActivity(): RaiderActivity {
        return RaiderActivity.Stand
    }

    addToScene(worldPosition: Vector2, radHeading: number) {
        super.addToScene(worldPosition, radHeading)
    }

    addTool(tool: RaiderTool) { // TODO refactor this
    }

    addTraining(skill: RaiderTraining) { // TODO refactor this
    }

    getRouteActivity(): VehicleActivity {
        return AnimEntityActivity.Stand
    }

    hasTool(tool: RaiderTool) { // TODO refactor this
    }

    hasTraining(training: RaiderTraining) { // TODO refactor this
    }

}
