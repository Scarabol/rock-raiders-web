import { Dynamite } from '../../collect/Dynamite'
import { Surface } from '../../map/Surface'
import { PathTarget } from '../../PathTarget'
import { RaiderSkill } from '../../raider/RaiderSkill'
import { PublicJob } from '../Job'
import { JobType } from '../JobType'
import { PriorityIdentifier } from '../PriorityIdentifier'

export class DynamiteJob extends PublicJob {

    color: number = 0xa06060
    surface: Surface
    dynamite: Dynamite

    constructor(surface: Surface, dynamite: Dynamite) {
        super(JobType.BLOW)
        this.dynamite = dynamite
    }

    getRequiredSkill(): RaiderSkill {
        return RaiderSkill.DEMOLITION
    }

    getWorkplaces(): PathTarget[] {
        return [new PathTarget(this.dynamite.getPosition2D())]
    }

    onJobComplete() {
        super.onJobComplete()
        this.dynamite.ignite()
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityDestruction
    }

}
