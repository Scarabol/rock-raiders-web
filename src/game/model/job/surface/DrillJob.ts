import { RaiderActivity } from '../../activities/RaiderActivity'
import { EntityType } from '../../EntityType'
import { FulfillerEntity } from '../../FulfillerEntity'
import { Surface } from '../../map/Surface'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { PublicJob } from '../Job'
import { JobType } from '../JobType'
import { PriorityIdentifier } from '../PriorityIdentifier'

export class DrillJob extends PublicJob {

    color: number = 0xa0a0a0
    surface: Surface

    constructor(surface: Surface) {
        super(JobType.DRILL)
        this.surface = surface
    }

    getRequiredTool(): RaiderTool {
        return RaiderTool.DRILL
    }

    getWorkplaces(): PathTarget[] {
        return this.surface.getDigPositions().map((p) => new PathTarget(p))
    }

    onJobComplete() {
        if (this.surface.onDrillComplete(this.fulfiller.last().getPosition2D())) super.onJobComplete()
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityDestruction
    }

    getWorkActivity(): RaiderActivity {
        return RaiderActivity.Drill
    }

    getWorkDuration(fulfiller: FulfillerEntity): number {
        const drillTimeInMsPerType: Map<EntityType, { drillTime: number, count: number }> = new Map()
        this.fulfiller.forEach((f) => {
            drillTimeInMsPerType.getOrUpdate(f.entityType, () => {
                return {drillTime: f.stats[this.surface.surfaceType.statsDrillName][f.level] * 1000, count: 0}
            }).count++
        })
        const drillTimeEntry = drillTimeInMsPerType.get(fulfiller.entityType)
        const drillTimeMs = drillTimeEntry?.drillTime / (drillTimeEntry?.count || 1) || null
        if (!drillTimeMs) console.warn('According to cfg this entity cannot drill this material')
        return drillTimeMs
    }

}
