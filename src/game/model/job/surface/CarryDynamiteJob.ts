import { Dynamite } from '../../collect/Dynamite'
import { RaiderSkill } from '../../raider/RaiderSkill'
import { CarryJob } from '../CarryJob'

export class CarryDynamiteJob extends CarryJob<Dynamite> {

    color: number = 0xa06060

    constructor(dynamite: Dynamite) {
        super(dynamite)
    }

    getRequiredSkill(): RaiderSkill {
        return RaiderSkill.DEMOLITION
    }

    onJobComplete() {
        super.onJobComplete()
        this.item.ignite()
    }

}
