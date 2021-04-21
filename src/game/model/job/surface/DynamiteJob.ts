import { Dynamite } from '../../../../scene/model/collect/Dynamite'
import { Surface } from '../../../../scene/model/map/Surface'
import { PathTarget } from '../../../../scene/model/PathTarget'
import { SurfaceJob } from './SurfaceJob'
import { JobType } from '../JobType'
import { RaiderSkill } from '../../../../scene/model/RaiderSkill'
import { PriorityIdentifier } from '../PriorityIdentifier'

export class DynamiteJob extends SurfaceJob {

    dynamite: Dynamite

    constructor(surface: Surface, dynamite: Dynamite) {
        super(JobType.BLOW, surface)
        this.dynamite = dynamite
        this.color = 0xa06060
        this.colorPriority = 2
        this.requiredSkill = RaiderSkill.DEMOLITION
    }

    getWorkplaces(): PathTarget[] {
        return [new PathTarget(this.dynamite.getPosition2D())]
    }

    onJobComplete() {
        super.onJobComplete()
        this.dynamite.ignite()
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityDestruction
    }

}
