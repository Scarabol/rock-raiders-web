import { RaiderActivity } from '../../activities/RaiderActivity'
import { FulfillerEntity } from '../../FulfillerEntity'
import { Surface } from '../../map/Surface'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { ShareableJob } from '../ShareableJob'
import { SurfacePathTarget } from './SurfacePathTarget'

export class DrillJob extends ShareableJob {
    color: number = 0xa0a0a0
    digPositions: PathTarget[]

    constructor(surface: Surface) {
        super()
        this.surface = surface
        this.digPositions = this.surface.getDigPositions().map((p) => new SurfacePathTarget(p, this.surface))
    }

    getRequiredTool(): RaiderTool {
        return RaiderTool.DRILL
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
        if (this.surface.onDrillComplete(this.fulfiller.last().sceneEntity.position2D.clone())) super.onJobComplete()
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.DESTRUCTION
    }

    getWorkActivity(): RaiderActivity {
        return RaiderActivity.Drill
    }

    getExpectedTimeLeft(fulfiller: FulfillerEntity): number {
        // TODO refactor this with surface "health" or "stability", which is reduced by drilling
        const drillPerSecond = this.fulfiller.map((f) => f.stats[this.surface.surfaceType.statsDrillName][f.level])
            .filter((n) => !isNaN(n) && n !== 0).map((n) => 1 / n).reduce((l, r) => l + r, 0)
        if (!drillPerSecond) {
            console.warn(`Unexpected drill per second ${drillPerSecond}`)
            return 120000
        }
        return 1000 / drillPerSecond
    }
}
