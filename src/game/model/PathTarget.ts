import { Vector2 } from 'three'
import { EventBus } from '../../event/EventBus'
import { MaterialAmountChanged } from '../../event/WorldEvents'
import { ITEM_ACTION_RANGE_SQ } from '../../params'
import { BarrierActivity, BuildingActivity, RaiderActivity } from './anim/AnimationActivity'
import { BuildingEntity } from './building/BuildingEntity'
import { BuildingSite } from './building/BuildingSite'
import { EntityType } from './EntityType'
import { GameState } from './GameState'
import { Surface } from './map/Surface'
import { MaterialEntity } from './material/MaterialEntity'

export class PathTarget {
    protected constructor(
        readonly targetLocation: Vector2,
        readonly radiusSq: number = 0,
        readonly building: BuildingEntity = null,
        readonly surface: Surface = null,
        readonly site: BuildingSite = null,
        private readonly headingOnSite: number = null) {
    }

    static fromLocation(targetLocation: Vector2, radiusSq: number = 0) {
        return new PathTarget(targetLocation, radiusSq, null, null, null)
    }

    static fromBuilding(building: BuildingEntity, targetLocation: Vector2) {
        return new PathTarget(targetLocation, 0, building, null, null)
    }

    static fromSurface(surface: Surface, targetLocation: Vector2) {
        return new PathTarget(targetLocation, 0, null, surface, null)
    }

    static fromSite(site: BuildingSite, targetLocation: Vector2, headingOnSite: number = 0) {
        return new PathTarget(targetLocation, ITEM_ACTION_RANGE_SQ, null, null, site, headingOnSite)
    }

    getFocusPoint(): Vector2 {
        if (this.building) return this.building.primarySurface.getCenterWorld2D()
        return this.targetLocation
    }

    isInvalid(): boolean {
        return (this.building && !this.building.isPowered()) || (this.surface && !this.surface.isWalkable()) || (this.site && (this.site.complete || this.site.canceled))
    }

    canGatherItem(): boolean {
        if (this.building?.entityType === EntityType.POWER_STATION || this.building?.entityType === EntityType.ORE_REFINERY) {
            return this.building.sceneEntity.activity === this.building.sceneEntity.getDefaultActivity()
        }
        return true
    }

    gatherItem(item: MaterialEntity) {
        if (this.building) {
            if (this.building.entityType === EntityType.POWER_STATION || this.building.entityType === EntityType.ORE_REFINERY) {
                this.building.sceneEntity.pickupEntity(item.sceneEntity)
                if (this.building.sceneEntity.carriedByIndex.size >= this.building.getMaxCarry()) {
                    this.building.sceneEntity.changeActivity(BuildingActivity.Deposit, () => {
                        this.building.sceneEntity.changeActivity()
                        this.building.sceneEntity.dropAllEntities()
                        item.onDeposit()
                    })
                }
            } else {
                item.onDeposit()
            }
        } else {
            item.sceneEntity.addToScene(null, this.headingOnSite)
            if (item.entityType === EntityType.BARRIER) {
                item.sceneEntity.changeActivity(BarrierActivity.Expand, () => item.sceneEntity.changeActivity(BarrierActivity.Long))
            }
            this.site?.addItem(item)
        }
    }

    getDropAction(): RaiderActivity {
        return this.building?.getDropAction() || RaiderActivity.Place
    }
}
