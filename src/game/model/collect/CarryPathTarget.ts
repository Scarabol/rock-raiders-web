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

    site: BuildingSite
    building: BuildingEntity

    constructor(location: Vector2, site: BuildingSite, building: BuildingEntity) {
        super(location)
        this.site = site
        this.building = building
    }

    canGatherItem(): boolean {
        if (this.building) {
            return this.building.activity.activityKey === this.building.getDefaultActivity().activityKey
        }
        return true
    }

    gatherItem(item: MaterialEntity) {
        if (this.site) {
            this.site.addItem(item)
        } else if (this.building) {
            if (this.building.entityType === EntityType.POWER_STATION || this.building.entityType === EntityType.ORE_REFINERY) {
                if (this.building.carryJoint) {
                    this.building.carryJoint.add(item.group)
                    item.group.position.set(0, 0, 0)
                }
                this.building.changeActivity(BuildingActivity.Deposit, () => {
                    this.building.changeActivity()
                    if (this.building.carryJoint) this.building.carryJoint.remove(item.group)
                    CarryPathTarget.addItemToStorage(item)
                    // TODO dispose item
                })
            } else {
                CarryPathTarget.addItemToStorage(item)
            }
        } else {
            item.worldMgr.sceneManager.scene.add(item.group)
        }
    }

    private static addItemToStorage(item: MaterialEntity) {
        switch (item.entityType) {
            case EntityType.CRYSTAL:
                GameState.numCrystal++
                EventBus.publishEvent(new MaterialAmountChanged(item.entityType))
                break
            case EntityType.ORE:
                GameState.numOre++
                EventBus.publishEvent(new MaterialAmountChanged(item.entityType))
                break
        }
    }

    getDropAction(): RaiderActivity {
        if (this.building && (this.building.entityType === EntityType.POWER_STATION || this.building.entityType === EntityType.ORE_REFINERY)) {
            return RaiderActivity.Deposit
        } else {
            return RaiderActivity.Place
        }
    }

}
