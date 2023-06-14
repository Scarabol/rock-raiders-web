import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { Surface } from '../../../terrain/Surface'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { ShareableJob } from '../ShareableJob'
import { Raider } from '../../raider/Raider'
import { VehicleEntity } from '../../vehicle/VehicleEntity'

export class ClearRubbleJob extends ShareableJob {
    lastRubblePositions: PathTarget[]

    constructor(readonly surface: Surface) {
        super()
        this.lastRubblePositions = this.surface.rubblePositions.map((p) => PathTarget.fromLocation(p))
    }

    getRequiredTool(): RaiderTool {
        return RaiderTool.SHOVEL
    }

    getWorkplace(entity: Raider | VehicleEntity): PathTarget { // TODO optimize performance and code duplication
        if (!this.surface.hasRubble()) return null
        const surfaceRubblePositions = this.surface.rubblePositions
        if (!this.lastRubblePositions.every((d) => surfaceRubblePositions.some((p) => p.equals(d.targetLocation))) ||
            !surfaceRubblePositions.every((p) => this.lastRubblePositions.some((d) => p.equals(d.targetLocation)))) {
            this.lastRubblePositions = surfaceRubblePositions.map((p) => PathTarget.fromLocation(p))
        }
        return entity.findShortestPath(this.lastRubblePositions)?.target
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

    getWorkActivity(): AnimationActivity {
        return RaiderActivity.Clear
    }
}
