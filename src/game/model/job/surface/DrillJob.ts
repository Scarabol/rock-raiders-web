import { RaiderActivity } from '../../activities/RaiderActivity'
import { Surface } from '../../map/Surface'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { ShareableJob } from '../ShareableJob'
import { SurfacePathTarget } from './SurfacePathTarget'

export class DrillJob extends ShareableJob {
    digPositions: PathTarget[]

    constructor(readonly surface: Surface) {
        super()
        this.digPositions = this.surface.getDigPositions().map((p) => new SurfacePathTarget(p, this.surface))
    }

    getRequiredTool(): RaiderTool {
        return RaiderTool.DRILL
    }

    getWorkplaces(): PathTarget[] { // TODO optimize performance and code duplication
        if (!this.surface.isDigable()) return []
        const surfaceDigPositions = this.surface.getDigPositions()
        if (!this.digPositions.every((d) => surfaceDigPositions.some((p) => p.equals(d.targetLocation))) ||
            !surfaceDigPositions.every((p) => this.digPositions.some((d) => p.equals(d.targetLocation)))) {
            this.digPositions = surfaceDigPositions.map((p) => new SurfacePathTarget(p, this.surface))
        }
        return this.digPositions
    }

    onJobComplete() {
        if (this.surface.onDrillComplete(this.fulfiller.last().sceneEntity.position2D.clone())) super.onJobComplete()
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.DESTRUCTION
    }

    getWorkActivity(): RaiderActivity {
        return RaiderActivity.Drill
    }

    getExpectedTimeLeft(): number {
        // TODO refactor this with surface "health" or "stability", which is reduced by drilling
        const drillPerSecond = this.fulfiller.map((f) => f.getDrillTime(this.surface))
            .map((drillTime) => drillTime > 0 ? 1 / drillTime : 0).reduce((l, r) => l + r, 0)
        if (!drillPerSecond) {
            console.warn(`Unexpected drill per second ${drillPerSecond}`)
            return 120000
        }
        return 1000 / drillPerSecond
    }
}
