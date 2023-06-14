import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { Surface } from '../../../terrain/Surface'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { ShareableJob } from '../ShareableJob'
import { Raider } from '../../raider/Raider'
import { VehicleEntity } from '../../vehicle/VehicleEntity'

export class ReinforceJob extends ShareableJob {
    digPositions: PathTarget[]

    constructor(readonly surface: Surface) {
        super()
        this.digPositions = this.surface.getDigPositions().map((p) => PathTarget.fromSurface(this.surface, p))
    }

    getWorkplace(entity: Raider | VehicleEntity): PathTarget { // TODO optimize performance and code duplication
        if (!this.surface.isReinforcable()) return null
        const surfaceDigPositions = this.surface.getDigPositions()
        if (!this.digPositions.every((d) => surfaceDigPositions.some((p) => p.equals(d.targetLocation))) ||
            !surfaceDigPositions.every((p) => this.digPositions.some((d) => p.equals(d.targetLocation)))) {
            this.digPositions = surfaceDigPositions.map((p) => PathTarget.fromSurface(this.surface, p))
        }
        return entity.findShortestPath(this.digPositions)?.target
    }

    onJobComplete() {
        super.onJobComplete()
        this.surface.reinforce()
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.REINFORCE
    }

    getWorkActivity(): AnimationActivity {
        return RaiderActivity.Reinforce
    }

    getExpectedTimeLeft(): number {
        return 2700
    }

    getRequiredTool(): RaiderTool {
        return RaiderTool.HAMMER
    }
}
