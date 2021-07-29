import { RaiderActivity } from '../../activities/RaiderActivity'
import { Surface } from '../../map/Surface'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { ShareableJob } from '../ShareableJob'

export class ClearRubbleJob extends ShareableJob {
    lastRubblePositions: PathTarget[]

    constructor(surface: Surface) {
        super()
        this.surface = surface
        this.lastRubblePositions = this.surface.rubblePositions.map((p) => new PathTarget(p))
    }

    getRequiredTool(): RaiderTool {
        return RaiderTool.SHOVEL
    }

    getWorkplaces(): PathTarget[] { // TODO optimize performance and code duplication
        const surfaceRubblePositions = this.surface.rubblePositions
        if (!this.lastRubblePositions.every((d) => surfaceRubblePositions.some((p) => p.equals(d.targetLocation))) ||
            !surfaceRubblePositions.every((p) => this.lastRubblePositions.some((d) => p.equals(d.targetLocation)))) {
            this.lastRubblePositions = surfaceRubblePositions.map((p) => new PathTarget(p))
        }
        return this.lastRubblePositions
    }

    onJobComplete() {
        this.surface.reduceRubble()
        if (!this.surface.hasRubble()) {
            this.surface.clearRubbleJob = null
            super.onJobComplete()
        }
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.CLEARING
    }

    getWorkActivity(): RaiderActivity {
        return RaiderActivity.Clear
    }
}
