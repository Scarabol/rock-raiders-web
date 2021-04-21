import { SurfaceJob } from './SurfaceJob'
import { JobType } from '../JobType'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { RaiderTool } from '../../../../scene/model/RaiderTool'
import { PathTarget } from '../../../../scene/model/PathTarget'
import { Surface } from '../../../../scene/model/map/Surface'

export class ReinforceJob extends SurfaceJob {

    constructor(surface: Surface) {
        super(JobType.REINFORCE, surface)
        this.color = 0x60a060
        this.colorPriority = 1
        this.requiredTool = RaiderTool.HAMMER
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
