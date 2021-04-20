import { Vector2 } from 'three'
import { RaiderActivity } from './activities/RaiderActivity'
import { CollectableEntity, CollectableType } from './collect/CollectableEntity'
import { PathTarget } from './PathTarget'
import { BuildingSite } from './BuildingSite'
import { Building } from '../../game/model/entity/building/Building'
import { BuildingEntity } from './BuildingEntity'
import { BuildingActivity } from './activities/BuildingActivity'
import { GameState } from '../../game/model/GameState'
import { EventBus } from '../../event/EventBus'
import { MaterialAmountChanged } from '../../event/WorldEvents'

export interface CollectionTarget {

    getDropAction(): RaiderActivity

    gatherItem(item: CollectableEntity)

}

export class CollectPathTarget extends PathTarget implements CollectionTarget {

    site: BuildingSite
    building: BuildingEntity

    constructor(location: Vector2, site: BuildingSite, building: BuildingEntity) {
        super(location)
        this.site = site
        this.building = building
    }

    gatherItem(item: CollectableEntity) {
        if (this.site) this.site.addItem(item)
        if (this.building) {
            if (this.building.type === Building.POWER_STATION || this.building.type === Building.ORE_REFINERY) {
                this.building.setActivity(BuildingActivity.Deposit, () => {
                    CollectPathTarget.addItemToStorage(item)
                })
            } else {
                CollectPathTarget.addItemToStorage(item)
            }
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
