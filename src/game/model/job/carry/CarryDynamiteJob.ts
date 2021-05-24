import { Dynamite } from '../../material/Dynamite'
import { RaiderTraining } from '../../raider/RaiderTraining'
import { CarryJob } from './CarryJob'

export class CarryDynamiteJob extends CarryJob<Dynamite> {

    color: number = 0xa06060

    constructor(dynamite: Dynamite) {
        super(dynamite)
    }

    getRequiredTraining(): RaiderTraining {
        return RaiderTraining.DEMOLITION
    }

    onJobComplete() {
        super.onJobComplete()
        this.item.ignite()
    }

}
