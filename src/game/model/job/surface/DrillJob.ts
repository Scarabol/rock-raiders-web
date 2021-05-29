import { RaiderActivity } from '../../activities/RaiderActivity'
import { EntityType } from '../../EntityType'
import { FulfillerEntity } from '../../FulfillerEntity'
import { Surface } from '../../map/Surface'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { ShareableJob } from '../ShareableJob'

export class DrillJob extends ShareableJob {

    color: number = 0xa0a0a0
    surface: Surface
    digPositions: PathTarget[]

    constructor(surface: Surface) {
        super()
        this.surface = surface
        this.digPositions = this.surface.getDigPositions().map((p) => new PathTarget(p))
    }

    getRequiredTool(): RaiderTool {
        return RaiderTool.DRILL
    }

    getWorkplaces(): PathTarget[] { // TODO optimize performance and code duplication
        const surfaceDigPositions = this.surface.getDigPositions()
        if (!this.digPositions.every((d) => surfaceDigPositions.some((p) => p.equals(d.targetLocation))) ||
            !surfaceDigPositions.every((p) => this.digPositions.some((d) => p.equals(d.targetLocation)))) {
            this.digPositions = surfaceDigPositions.map((p) => new PathTarget(p))
        }
        return this.digPositions
    }

    onJobComplete() {
        if (this.surface.onDrillComplete(this.fulfiller.last().sceneEntity.position2D.clone())) super.onJobComplete()
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
