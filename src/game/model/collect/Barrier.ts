import { BarrierActivity } from '../activities/BarrierActivity'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { CollectableEntity } from './CollectableEntity'
import { CollectableType } from './CollectableType'
import { CollectPathTarget } from './CollectPathTarget'

export class Barrier extends CollectableEntity {

    constructor() {
        super(CollectableType.BARRIER, 'MiscAnims/Barrier/Barrier.ae')
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
