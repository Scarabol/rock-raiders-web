import { Surface } from '../../map/Surface'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { JobType } from '../JobType'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { SurfaceJob } from './SurfaceJob'

export class DrillJob extends SurfaceJob {

    constructor(surface: Surface) {
        super(JobType.DRILL, surface)
        this.color = 0xa0a0a0
        this.requiredTool = RaiderTool.DRILL
        this.surface = surface
    }

    getWorkplaces(): PathTarget[] {
        return this.surface.getDigPositions().map((p) => new PathTarget(p))
    }

    onJobComplete() {
        super.onJobComplete()
        this.surface.collapse()
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityDestruction
    }

}
