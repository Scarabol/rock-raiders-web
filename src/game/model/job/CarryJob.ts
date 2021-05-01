import { CarryPathTarget } from '../collect/CarryPathTarget'
import { MaterialEntity } from '../collect/MaterialEntity'
import { PublicJob } from './Job'
import { JobType } from './JobType'
import { PriorityIdentifier } from './PriorityIdentifier'

export class CarryJob<I extends MaterialEntity> extends PublicJob {

    item: I

    constructor(item: I) {
        super(JobType.CARRY)
        this.item = item
    }

    getWorkplaces(): CarryPathTarget[] {
        return this.item.getCarryTargets()
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return this.item.getPriorityIdentifier()
    }

    setActualWorkplace(target: CarryPathTarget) {
        this.item.setTargetSite(target.site)
    }

    getCarryItem(): I {
        return this.item
    }

}
