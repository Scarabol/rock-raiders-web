import { SurfaceJob } from './SurfaceJob'
import { JobType } from '../JobType'
import { Surface } from '../../../../scene/model/map/Surface'
import { PathTarget } from '../../../../scene/model/PathTarget'
import { RaiderTool } from '../../../../scene/model/RaiderTool'
import { PriorityIdentifier } from '../PriorityIdentifier'

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
