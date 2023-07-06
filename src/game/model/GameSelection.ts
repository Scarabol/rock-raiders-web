import { Sample } from '../../audio/Sample'
import { SoundManager } from '../../audio/SoundManager'
import { SelectPanelType } from '../../event/LocalEvents'
import { BuildingEntity } from './building/BuildingEntity'
import { EntityType } from './EntityType'
import { DrillJob } from './job/surface/DrillJob'
import { ClearRubbleJob } from './job/surface/ClearRubbleJob'
import { GetToolJob } from './job/raider/GetToolJob'
import { Surface } from '../terrain/Surface'
import { MaterialEntity } from './material/MaterialEntity'
import { Raider } from './raider/Raider'
import { RaiderTool } from './raider/RaiderTool'
import { VehicleEntity } from './vehicle/VehicleEntity'
import { SelectionFrameComponent } from '../component/SelectionFrameComponent'
import { VehicleUpgrade } from './vehicle/VehicleUpgrade'
import { VehicleUpgradeJob } from './job/VehicleUpgradeJob'

export class GameSelection {
    surface: Surface = null
    building: BuildingEntity = null
    raiders: Raider[] = []
    vehicles: VehicleEntity[] = []
    fence: MaterialEntity = null
    doubleSelect: BuildingEntity | VehicleEntity = null

    isEmpty(): boolean {
        return !this.surface && !this.building && this.raiders.length < 1 && this.vehicles.length < 1 && !this.fence
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
        this.fence?.worldMgr.ecs.getComponents(this.fence.entity).get(SelectionFrameComponent)?.deselect()
        this.fence = null
    }

    canMove(): boolean {
        return this.raiders.length > 0 || this.vehicles.some((v) => !!v.driver)
    }

    set(selection: GameSelection) {
        this.doubleSelect = null // XXX refactor this only reset if needed
        let added = false
        added = this.syncRaiderSelection(this.raiders, selection.raiders) || added
        added = this.syncVehicleSelection(this.vehicles, selection.vehicles) || added
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
        if (this.fence !== selection.fence) {
            this.fence?.worldMgr.ecs.getComponents(this.fence.entity).get(SelectionFrameComponent)?.deselect()
            this.fence = selection.fence
            if (selection.fence) {
                const selectionFrameComponent = selection.fence.worldMgr.ecs.getComponents(selection.fence.entity).get(SelectionFrameComponent)
                added = !selectionFrameComponent.isSelected()
                selectionFrameComponent.select()
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

    private syncRaiderSelection(before: Raider[], after: Raider[]): boolean {
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
            }
        })
        deselected.forEach((r) => before.remove(r))
        return added
    }

    private syncVehicleSelection(before: VehicleEntity[], after: VehicleEntity[]): boolean {
        let added = false
        const deselected = before.filter((v) => {
            const deselected = after.indexOf(v) === -1
            if (deselected) v.deselect()
            return deselected
        })
        after.forEach((v) => {
            if (before.indexOf(v) === -1) {
                if (v.select()) {
                    before.push(v)
                    added = true
                }
            } else if (v.stats.CanDoubleSelect && !!v.driver) {
                if (v.doubleSelect()) {
                    this.doubleSelect = v
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
        } else if (this.fence) {
            return SelectPanelType.FENCE
        }
        return SelectPanelType.NONE
    }

    assignSurfaceJob(job: DrillJob | ClearRubbleJob) {
        if (!job) return
        this.raiders.forEach((r) => {
            if (r.isPrepared(job)) {
                r.setJob(job)
            } else {
                r.setJob(new GetToolJob(r.worldMgr.entityMgr, job.requiredTool, r.worldMgr.entityMgr.getClosestBuildingByType(r.sceneEntity.position.clone(), EntityType.TOOLSTATION)), job)
            }
        })
        this.vehicles.forEach((v) => {
            if (v.isPrepared(job)) {
                v.setJob(job)
            } // do not auto upgrade vehicles
        })
    }

    assignCarryJob(material: MaterialEntity) {
        if (!material) return
        const job = material.setupCarryJob()
        const entity = [...this.vehicles, ...this.raiders].find((e) => e.hasCapacity())
            || [...this.vehicles, ...this.raiders].find((e) => e.getCarryCapacity() > 0)
        entity?.setJob(job)
    }

    assignUpgradeJob(upgrade: VehicleUpgrade) {
        if (!upgrade) return
        this.vehicles.forEach((v) => v.canUpgrade(upgrade) && v.setJob(new VehicleUpgradeJob(v.worldMgr.entityMgr, v, upgrade)))
    }

    canDrill(surface: Surface): boolean {
        return this.raiders.some((r) => r.canDrill(surface)) || this.vehicles.some((v) => v.canDrill(surface))
    }

    canClear(): boolean {
        return this.raiders.some((r) => r.hasTool(RaiderTool.SHOVEL)) || this.vehicles.some((v) => v.canClear())
    }

    canPickup(): boolean {
        return this.raiders.some((r) => r.getCarryCapacity() > 0) || this.vehicles.some((v) => v.getCarryCapacity() > 0)
    }
}
