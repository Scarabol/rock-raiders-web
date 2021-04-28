import { BarrierActivity } from '../activities/activities/BarrierActivity'
import { CollectPathTarget } from '../CollectPathTarget'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { CollectableEntity } from './CollectableEntity'
import { CollectableType } from './CollectableType'

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
