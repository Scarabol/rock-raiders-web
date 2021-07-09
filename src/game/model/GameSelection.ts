import { Vector2 } from 'three'
import { Sample } from '../../audio/Sample'
import { SoundManager } from '../../audio/SoundManager'
import { SelectPanelType } from '../../event/LocalEvents'
import { TILESIZE } from '../../params'
import { BuildingEntity } from './building/BuildingEntity'
import { EntityType } from './EntityType'
import { Job } from './job/Job'
import { GetToolJob } from './job/raider/GetToolJob'
import { MoveJob } from './job/raider/MoveJob'
import { Surface } from './map/Surface'
import { Raider } from './raider/Raider'
import { Selectable } from './Selectable'
import { VehicleEntity } from './vehicle/VehicleEntity'

export class GameSelection {

    surface: Surface = null
    building: BuildingEntity = null
    raiders: Raider[] = []
    vehicles: VehicleEntity[] = []

    isEmpty(): boolean {
        return !this.surface && !this.building && this.raiders.length < 1 && this.vehicles.length < 1
    }

    set(selection: GameSelection) {
        let added = false
        added = GameSelection.syncSelection(this.raiders, selection.raiders) || added
        added = GameSelection.syncSelection(this.vehicles, selection.vehicles) || added
        if (this.building !== selection.building) {
            this.building?.deselect()
            if (selection.building?.isInSelection()) {
                this.building = selection.building
                if (this.building.select()) added = true
            } else {
                this.building = null
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

    private static syncSelection(before: Selectable[], after: Selectable[]): boolean {
        let added = false
        before.forEach((r) => {
            if (after.indexOf(r) === -1) {
                before.remove(r)
                r.deselect()
            }
        })
        after.forEach((r) => {
            if (before.indexOf(r) === -1) {
                if (r.select()) {
                    before.push(r)
                    added = true
                }
            }
        })
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

    deselectAll() {
        this.raiders.forEach((r) => r.deselect())
        this.raiders = []
        this.vehicles.forEach((v) => v.deselect())
        this.vehicles = []
        this.building?.deselect()
        this.building = null
        this.surface?.deselect()
        this.surface = null
    }

}
