import { RaiderActivity } from '../../activities/RaiderActivity'
import { Surface } from '../../map/Surface'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { ShareableJob } from '../ShareableJob'
import { SurfacePathTarget } from './SurfacePathTarget'

export class ReinforceJob extends ShareableJob {
    digPositions: PathTarget[]

    constructor(surface: Surface) {
        super()
        this.surface = surface
        this.digPositions = this.surface.getDigPositions().map((p) => new SurfacePathTarget(p, this.surface))
    }

    getWorkplaces(): PathTarget[] { // TODO optimize performance and code duplication
        const surfaceDigPositions = this.surface.getDigPositions()
        if (!this.digPositions.every((d) => surfaceDigPositions.some((p) => p.equals(d.targetLocation))) ||
            !surfaceDigPositions.every((p) => this.digPositions.some((d) => p.equals(d.targetLocation)))) {
            this.digPositions = surfaceDigPositions.map((p) => new SurfacePathTarget(p, this.surface))
        }
        return this.digPositions
    }

    onJobComplete() {
        super.onJobComplete()
        this.surface.reinforce()
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.REINFORCE
    }

    getWorkActivity(): RaiderActivity {
        return RaiderActivity.Reinforce
    }

    getExpectedTimeLeft(): number {
        return 2700
    }

    getRequiredTool(): RaiderTool {
        return RaiderTool.HAMMER
    }
}
