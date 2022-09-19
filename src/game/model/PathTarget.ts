import { Vector2 } from 'three'
import { EventBus } from '../../event/EventBus'
import { MaterialAmountChanged } from '../../event/WorldEvents'
import { ITEM_ACTION_RANGE_SQ } from '../../params'
import { BarrierActivity } from './activities/BarrierActivity'
import { BuildingActivity } from './activities/BuildingActivity'
import { RaiderActivity } from './activities/RaiderActivity'
import { BuildingEntity } from './building/BuildingEntity'
import { BuildingSite } from './building/BuildingSite'
import { EntityType } from './EntityType'
import { GameState } from './GameState'
import { CarryJob } from './job/carry/CarryJob'
import { Job } from './job/Job'
import { Surface } from './map/Surface'
import { MaterialEntity } from './material/MaterialEntity'

export class PathTarget {
    private gatherReservedBy: Job = null

    protected constructor(
        readonly targetLocation: Vector2,
        readonly building: BuildingEntity = null,
        readonly surface: Surface = null,
        readonly site: BuildingSite = null,
        readonly radiusSq: number = 0,
        readonly headingOnSite: number = null) {
    }

    static fromLocation(targetLocation: Vector2, radiusSq: number = 0) {
        return new PathTarget(targetLocation, null, null, null, radiusSq)
    }

    static fromBuilding(building: BuildingEntity, targetLocation: Vector2) {
        return new PathTarget(targetLocation, building, null, null, 0)
    }

    static fromSurface(surface: Surface, targetLocation: Vector2) {
        return new PathTarget(targetLocation, null, surface, null, 0)
    }

    static fromSite(site: BuildingSite, targetLocation: Vector2, headingOnSite: number = 0) {
        return new PathTarget(targetLocation, null, null, site, ITEM_ACTION_RANGE_SQ, headingOnSite)
    }

    getFocusPoint(): Vector2 {
        if (this.building) return this.building.primarySurface.getCenterWorld2D()
        return this.targetLocation
    }

    isInvalid(): boolean {
        return (this.building && !this.building.isPowered()) || (this.surface && !this.surface.isWalkable()) || (this.site && (this.site.complete || this.site.canceled))
    }

    reserveGatherSlot(job: CarryJob): boolean {
        if (this.building?.entityType === EntityType.POWER_STATION || this.building?.entityType === EntityType.ORE_REFINERY) {
            if (!this.gatherReservedBy && this.building.sceneEntity.activity.activityKey === this.building.sceneEntity.getDefaultActivity().activityKey) {
                this.gatherReservedBy = job // TODO how to avoid deadlock between reserve and gather?
                return true
            } else {
                return this.gatherReservedBy === job
            }
        }
        return true
    }

    gatherItem(item: MaterialEntity) {
        if (this.building) {
            if (this.building.entityType === EntityType.POWER_STATION || this.building.entityType === EntityType.ORE_REFINERY) {
                this.building.sceneEntity.pickupEntity(item.sceneEntity)
                this.building.sceneEntity.changeActivity(BuildingActivity.Deposit, () => {
                    this.building.sceneEntity.changeActivity()
                    this.building.sceneEntity.dropAllEntities()
                    this.addItemToStorage(item)
                })
            } else {
                this.addItemToStorage(item)
            }
        } else {
            item.sceneEntity.addToScene(null, this.headingOnSite)
            if (item.entityType === EntityType.BARRIER) {
                item.sceneEntity.changeActivity(BarrierActivity.Expand, () => item.sceneEntity.changeActivity(BarrierActivity.Long))
            }
            this.site?.addItem(item)
        }
    }

    private addItemToStorage(item: MaterialEntity) {
        switch (item.entityType) {
            case EntityType.CRYSTAL:
                GameState.numCrystal++
                break
            case EntityType.ORE:
                GameState.numOre++
                break
        }
        EventBus.publishEvent(new MaterialAmountChanged())
        item.sceneEntity.disposeFromScene()
        this.gatherReservedBy = null
    }

    getDropAction(): RaiderActivity {
        return this.building?.getDropAction() || RaiderActivity.Place
    }
}
