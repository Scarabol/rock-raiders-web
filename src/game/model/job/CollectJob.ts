import { CollectableEntity } from '../../../scene/model/collect/CollectableEntity'
import { Vector2 } from 'three'
import { FulfillerEntity } from '../../../scene/model/FulfillerEntity'
import { PublicJob } from './Job'
import { JobType } from './JobType'
import { PriorityIdentifier } from './PriorityIdentifier'

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

    getPriorityIdentifier(): PriorityIdentifier {
        return this.item.getPriorityIdentifier()
    }

}
