import { Vector2 } from 'three'
import { EventBus } from '../../../event/EventBus'
import { MaterialAmountChanged } from '../../../event/WorldEvents'
import { BuildingActivity } from '../activities/BuildingActivity'
import { RaiderActivity } from '../activities/RaiderActivity'
import { BuildingEntity } from '../building/BuildingEntity'
import { BuildingSite } from '../building/BuildingSite'
import { EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { PathTarget } from '../PathTarget'
import { MaterialEntity } from './MaterialEntity'

export class CarryPathTarget extends PathTarget {

    constructor(location: Vector2) {
        super(location)
    }

    canGatherItem(): boolean {
        return true
    }

    gatherItem(item: MaterialEntity) {
        item.sceneEntity.addToScene(null, null)
    }

    getDropAction(): RaiderActivity {
        return RaiderActivity.Place
    }

    isInvalid(): boolean {
        return false
    }

}

export class SiteCarryPathTarget extends CarryPathTarget {

    site: BuildingSite

    constructor(location: Vector2, site: BuildingSite) {
        super(location)
        this.site = site
    }

    gatherItem(item: MaterialEntity) {
        this.site.addItem(item)
    }

    getDropAction(): RaiderActivity {
        return this.site.getDropAction()
    }

    isInvalid(): boolean {
        return this.site.complete || this.site.canceled
    }

}

export class BuildingCarryPathTarget extends CarryPathTarget {

    building: BuildingEntity

    constructor(building: BuildingEntity) {
        super(building.getDropPosition2D())
        this.building = building
    }

    canGatherItem(): boolean {
        return this.building.sceneEntity.activity.activityKey === this.building.getDefaultActivity().activityKey
    }

    gatherItem(item: MaterialEntity) {
        if (this.building.entityType === EntityType.POWER_STATION || this.building.entityType === EntityType.ORE_REFINERY) {
            if (this.building.sceneEntity.animation?.carryJoint) {
                this.building.sceneEntity.animation.carryJoint.add(item.sceneEntity.group)
                item.sceneEntity.position.set(0, 0, 0)
            }
            this.building.sceneEntity.changeActivity(BuildingActivity.Deposit, () => {
                this.building.sceneEntity.changeActivity()
                if (this.building.sceneEntity.animation?.carryJoint) this.building.sceneEntity.animation.carryJoint.remove(item.sceneEntity.group)
                BuildingCarryPathTarget.addItemToStorage(item)
            })
        } else {
            BuildingCarryPathTarget.addItemToStorage(item)
        }
    }

    private static addItemToStorage(item: MaterialEntity) {
        switch (item.entityType) {
            case EntityType.CRYSTAL:
                GameState.numCrystal++
                break
            case EntityType.ORE:
                GameState.numOre++
                break
        }
        EventBus.publishEvent(new MaterialAmountChanged())
        item.sceneEntity.removeFromScene()
    }

    getDropAction(): RaiderActivity {
        return this.building.getDropAction()
    }

    isInvalid(): boolean {
        return !this.building.isUsable()
    }

}
