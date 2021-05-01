import { BarrierActivity } from '../activities/BarrierActivity'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { CarryPathTarget } from './CarryPathTarget'
import { MaterialEntity } from './MaterialEntity'

export class Barrier extends MaterialEntity {

    constructor() {
        super(EntityType.BARRIER, 'MiscAnims/Barrier/Barrier.ae')
        this.priorityIdentifier = PriorityIdentifier.aiPriorityConstruction
        this.changeActivity()
    }

    protected updateTargets(): CarryPathTarget[] {
        return this.targets // TODO check target site still requires barrier, otherwise choose toolstation
    }

    getDefaultActivity(): BarrierActivity {
        return BarrierActivity.Short
    }

}
