import { CollectableEntity, CollectableType } from '../../../scene/model/collect/CollectableEntity'
import { Vector2 } from 'three'
import { FulfillerEntity } from '../../../scene/model/FulfillerEntity'
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
        return fulfiller.carries === null && this.item.hasTarget()
    }

    getPriorityIdentifier(): string {
        return this.item.getCollectableType() === CollectableType.CRYSTAL ? 'aiPriorityCrystal' : 'aiPriorityOre'
    }

}
