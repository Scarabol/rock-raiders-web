import { Surface } from '../../map/Surface'
import { PathTarget } from '../../PathTarget'
import { PublicJob } from '../Job'
import { JobType } from '../JobType'
import { PriorityIdentifier } from '../PriorityIdentifier'

export class ReinforceJob extends PublicJob {

    color: number = 0x60a060
    surface: Surface

    constructor(surface: Surface) {
        super(JobType.REINFORCE)
        this.surface = surface
    }

    getWorkplaces(): PathTarget[] {
        return this.surface.getDigPositions().map((p) => new PathTarget(p))
    }

    onJobComplete() {
        super.onJobComplete()
        this.surface.reinforce()
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityReinforce
    }

}
