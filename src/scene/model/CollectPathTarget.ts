import { Vector2 } from 'three'
import { EventBus } from '../../event/EventBus'
import { MaterialAmountChanged } from '../../event/WorldEvents'
import { Building } from '../../game/model/entity/building/Building'
import { GameState } from '../../game/model/GameState'
import { BuildingActivity } from './activities/BuildingActivity'
import { RaiderActivity } from './activities/RaiderActivity'
import { BuildingEntity } from './BuildingEntity'
import { BuildingSite } from './BuildingSite'
import { CollectableEntity } from './collect/CollectableEntity'
import { CollectableType } from './collect/CollectableType'
import { PathTarget } from './PathTarget'

export class CollectPathTarget extends PathTarget {

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

    gatherItem(item: CollectableEntity) {
        if (this.site) {
            this.site.addItem(item)
        } else if (this.building) {
            if (this.building.type === Building.POWER_STATION || this.building.type === Building.ORE_REFINERY) {
                if (this.building.carryJoint) {
                    this.building.carryJoint.add(item.group)
                    item.group.position.set(0, 0, 0)
                }
                this.building.changeActivity(BuildingActivity.Deposit, () => {
                    this.building.changeActivity()
                    if (this.building.carryJoint) this.building.carryJoint.remove(item.group)
                    CollectPathTarget.addItemToStorage(item)
                    // TODO dispose item
                })
            } else {
                CollectPathTarget.addItemToStorage(item)
            }
        } else {
            item.worldMgr.sceneManager.scene.add(item.group)
        }
    }

    private static addItemToStorage(item: CollectableEntity) {
        switch (item.getCollectableType()) {
            case CollectableType.CRYSTAL:
                GameState.numCrystal++
                EventBus.publishEvent(new MaterialAmountChanged(item.getCollectableType()))
                break
            case CollectableType.ORE:
                GameState.numOre++
                EventBus.publishEvent(new MaterialAmountChanged(item.getCollectableType()))
                break
        }
    }

    getDropAction(): RaiderActivity {
        if (this.building && (this.building.type === Building.POWER_STATION || this.building.type === Building.ORE_REFINERY)) {
            return RaiderActivity.Deposit
        } else {
            return RaiderActivity.Place
        }
    }

}
