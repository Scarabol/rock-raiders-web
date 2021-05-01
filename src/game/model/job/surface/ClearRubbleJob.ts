import { Surface } from '../../map/Surface'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { PublicJob } from '../Job'
import { JobType } from '../JobType'
import { PriorityIdentifier } from '../PriorityIdentifier'

export class ClearRubbleJob extends PublicJob {

    surface: Surface

    constructor(surface: Surface) {
        super(JobType.CLEAR_RUBBLE)
        this.surface = surface
    }

    getRequiredTool(): RaiderTool {
        return RaiderTool.SHOVEL
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
