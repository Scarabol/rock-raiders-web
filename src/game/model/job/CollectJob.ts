import { CollectableEntity } from '../../../scene/model/collect/CollectableEntity'
import { FulfillerEntity } from '../../../scene/model/FulfillerEntity'
import { PublicJob } from './Job'
import { JobType } from './JobType'
import { PriorityIdentifier } from './PriorityIdentifier'
import { PathTarget } from '../../../scene/model/PathTarget'

export class CollectJob extends PublicJob {

    item: CollectableEntity

    constructor(item: CollectableEntity) {
        super(JobType.CARRY)
        this.item = item
    }

    getWorkplaces(): PathTarget[] {
        return [new PathTarget(this.item.getPosition2D())]
    }

    isQualified(fulfiller: FulfillerEntity) {
        return fulfiller.carries === null && this.item.hasTarget()
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return this.item.getPriorityIdentifier()
    }

}
