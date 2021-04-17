import { CollectableEntity, CollectableType, CollectTargetType } from '../../../scene/model/collect/CollectableEntity'
import { Vector2 } from 'three'
import { FulfillerEntity } from '../../../scene/model/FulfillerEntity'
import { Building } from '../entity/building/Building'
import { GameState } from '../GameState'
import { EventBus } from '../../../event/EventBus'
import { CollectEvent } from '../../../event/WorldEvents'
import { PublicJob } from './Job'
import { JobType } from './JobType'

export class CollectJob extends PublicJob {

    item: CollectableEntity

    constructor(item: CollectableEntity) {
        super(JobType.CARRY)
        this.item = item
    }

    getWorkplaces(): Vector2[] {
        return [this.item.getPosition2D()]
    }

    isQualified(fulfiller: FulfillerEntity) {
        return fulfiller.carries === null && this.item.getTargetPositions().length > 0
    }

    onJobComplete() {
        super.onJobComplete()
        if (this.item.getTargetType() === Building.TOOLSTATION) {
            switch (this.item.getCollectableType()) {
                case CollectableType.CRYSTAL:
                    GameState.numCrystal++
                    EventBus.publishEvent(new CollectEvent(this.item.getCollectableType()))
                    break
                case CollectableType.ORE:
                    GameState.numOre++
                    EventBus.publishEvent(new CollectEvent(this.item.getCollectableType()))
                    break
            }
        } else if (this.item.getTargetType() === CollectTargetType.BUILDING_SITE) {
            this.item.targetSite.addItem(this.item)
        } else {
            console.error('target type not yet implemented: ' + this.item.getTargetType())
        }
    }

    getPriorityIdentifier(): string {
        return this.item.getCollectableType() === CollectableType.CRYSTAL ? 'aiPriorityCrystal' : 'aiPriorityOre'
    }

}
