import { Vector2 } from 'three'
import { Sample } from '../../audio/Sample'
import { SoundManager } from '../../audio/SoundManager'
import { SelectPanelType } from '../../event/LocalEvents'
import { TILESIZE } from '../../params'
import { BuildingEntity } from './building/BuildingEntity'
import { EntityType } from './EntityType'
import { FulfillerEntity } from './FulfillerEntity'
import { Job } from './job/Job'
import { GetToolJob } from './job/raider/GetToolJob'
import { MoveJob } from './job/raider/MoveJob'
import { Surface } from './map/Surface'
import { MaterialEntity } from './material/MaterialEntity'
import { Raider } from './raider/Raider'
import { RaiderTool } from './raider/RaiderTool'
import { VehicleEntity } from './vehicle/VehicleEntity'

export class GameSelection {

    surface: Surface = null
    building: BuildingEntity = null
    raiders: Raider[] = []
    vehicles: VehicleEntity[] = []
    doubleSelect: BuildingEntity | VehicleEntity = null

    isEmpty(): boolean {
        return !this.surface && !this.building && this.raiders.length < 1 && this.vehicles.length < 1
    }

    deselectAll() {
        this.raiders.forEach((r) => r.deselect())
        this.raiders = []
        this.vehicles.forEach((v) => v.deselect())
        this.vehicles = []
        this.building?.deselect()
        this.building = null
        this.surface?.deselect()
        this.surface = null
        this.doubleSelect = null
    }

    canMove(): boolean {
        return this.raiders.length > 0 || this.vehicles.some((v) => !!v.driver)
    }

    set(selection: GameSelection) {
        this.doubleSelect = null // XXX refactor this only reset if needed
        let added = false
        added = this.syncSelection(this.raiders, selection.raiders) || added
        added = this.syncSelection(this.vehicles, selection.vehicles) || added
        if (this.building !== selection.building) {
            this.building?.deselect()
            if (selection.building?.isInSelection()) {
                this.building = selection.building
                if (this.building.select()) added = true
            } else {
                this.building = null
            }
        } else if (this.building?.stats.CanDoubleSelect) {
            if (this.building.doubleSelect()) {
                this.doubleSelect = this.building
                added = true
            }
        }
        if (this.surface !== selection.surface) {
            this.surface?.deselect()
            if (selection.surface?.isInSelection()) {
                this.surface = selection.surface
                if (this.surface.select()) added = true
            } else {
                this.surface = null
            }
        }
        if (added) SoundManager.playSample(Sample.SFX_Okay)
    }

    private syncSelection(before: FulfillerEntity[], after: FulfillerEntity[]): boolean {
        let added = false
        const deselected = before.filter((r) => {
            const deselected = after.indexOf(r) === -1
            if (deselected) r.deselect()
            return deselected
        })
        after.forEach((r) => {
            if (before.indexOf(r) === -1) {
                if (r.select()) {
                    before.push(r)
                    added = true
                }
            } else if (r.stats.CanDoubleSelect && r['driver']) {
                if (r.doubleSelect()) {
                    this.doubleSelect = r as VehicleEntity
                    added = true
                }
            }
        })
        deselected.forEach((r) => before.remove(r))
        return added
    }

    getSelectPanelType(): SelectPanelType {
        if (this.raiders.length > 0) {
            return SelectPanelType.RAIDER
        } else if (this.vehicles.length > 0) {
            return SelectPanelType.VEHICLE
        } else if (this.building) {
            return SelectPanelType.BUILDING
        } else if (this.surface) {
            return SelectPanelType.SURFACE
        }
    }

    assignSurfaceJob(job: Job) {
        if (!job) return
        this.raiders.forEach((r) => {
            if (r.isPrepared(job)) {
                r.setJob(job)
            } else {
                r.setJob(new GetToolJob(r.entityMgr, job.getRequiredTool(), r.entityMgr.getClosestBuildingByType(r.sceneEntity.position.clone(), EntityType.TOOLSTATION)), job)
            }
        })
        this.vehicles.forEach((v) => {
            if (v.isPrepared(job)) {
                v.setJob(job)
            } // do not auto upgrade vehicles
        })
    }

    assignMoveJob(target: Vector2) {
        if (!target) return
        const raiderGridSize = TILESIZE / 3
        const raiderTarget = target.clone().divideScalar(raiderGridSize).floor().addScalar(0.5).multiplyScalar(raiderGridSize)
        this.raiders.forEach((r) => r.setJob(new MoveJob(raiderTarget)))
        const vehicleGridSize = TILESIZE
        const vehicleTarget = target.clone().divideScalar(vehicleGridSize).floor().addScalar(0.5).multiplyScalar(vehicleGridSize)
        this.vehicles.forEach((v) => v.setJob(new MoveJob(vehicleTarget)))
    }

    assignCarryJob(material: MaterialEntity) {
        if (!material) return
        const job = material.createCarryJob()
        const doneByVehicle = this.vehicles.some((v) => {
            if (v.isPrepared(job)) {
                v.setJob(job)
                return true
            }
        })
        if (doneByVehicle) return
        this.raiders.some((r) => {
            if (r.isPrepared(job)) {
                r.setJob(job)
                return true
            }
        })
    }

    canDrill(surface: Surface): boolean {
        return this.raiders.some((r) => r.canDrill(surface)) || this.vehicles.some((v) => v.canDrill(surface))
    }

    canClear(): boolean {
        return this.raiders.some((r) => r.hasTool(RaiderTool.SHOVEL)) || this.vehicles.some((v) => v.canClear())
    }

    canPickup(): boolean {
        return this.raiders.some((r) => r.hasCapacity()) || this.vehicles.some((v) => v.hasCapacity())
    }

}
