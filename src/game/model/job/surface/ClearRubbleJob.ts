import { Surface } from '../../map/Surface'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { JobType } from '../JobType'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { SurfaceJob } from './SurfaceJob'

export class ClearRubbleJob extends SurfaceJob {

    constructor(surface: Surface) {
        super(JobType.CLEAR_RUBBLE, surface)
        this.requiredTool = RaiderTool.SHOVEL
        this.surface = surface
    }

    getWorkplaces(): PathTarget[] {
        const rubblePositions = this.surface.rubblePositions
        return rubblePositions.length > 0 ? [new PathTarget(rubblePositions[0])] : [] // use first (no need to optimize)
    }

    onJobComplete() {
        super.onJobComplete()
        this.surface.reduceRubble()
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityClearing
    }

}
