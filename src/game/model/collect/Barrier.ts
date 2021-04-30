import { BarrierActivity } from '../activities/BarrierActivity'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { CollectableEntity } from './CollectableEntity'
import { CollectPathTarget } from './CollectPathTarget'

export class Barrier extends CollectableEntity {

    constructor() {
        super(EntityType.BARRIER, 'MiscAnims/Barrier/Barrier.ae')
        this.priorityIdentifier = PriorityIdentifier.aiPriorityConstruction
        this.changeActivity()
    }

    protected updateTargets(): CollectPathTarget[] {
        return this.targets // TODO check target site still requires barrier, otherwise choose toolstation
    }

    getDefaultActivity(): BarrierActivity {
        return BarrierActivity.Short
    }

}
