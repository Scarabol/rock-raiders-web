import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { Surface } from '../../../terrain/Surface'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'
import { Job, JobFulfiller } from '../Job'
import { EntityType } from '../../EntityType'

export class ClearRubbleJob extends Job {
    readonly fulfiller: JobFulfiller[] = []
    lastRubblePositions: PathTarget[] = []

    constructor(readonly surface: Surface) {
        super()
        this.lastRubblePositions = this.surface.rubblePositions.map((p) => PathTarget.fromLocation(p))
        this.requiredTool = RaiderTool.SHOVEL
        this.priorityIdentifier = PriorityIdentifier.CLEARING
    }

    getWorkplace(entity: JobFulfiller): PathTarget | undefined {
        if (!this.surface.hasRubble()) return undefined
        if (entity.entityType === EntityType.BULLDOZER) {
            return entity.findShortestPath(PathTarget.fromLocation(this.surface.getCenterWorld2D()))?.target
        } else {
            const surfaceRubblePositions = this.surface.rubblePositions
            if (!this.lastRubblePositions.every((d) => surfaceRubblePositions.some((p) => p.equals(d.targetLocation))) ||
                !surfaceRubblePositions.every((p) => this.lastRubblePositions.some((d) => p.equals(d.targetLocation)))) {
                this.lastRubblePositions = surfaceRubblePositions.map((p) => PathTarget.fromLocation(p))
            }
            return entity.findShortestPath(this.lastRubblePositions)?.target
        }
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        if (fulfiller.entityType === EntityType.BULLDOZER) {
            while (this.surface.hasRubble()) {
                this.surface.reduceRubble()
            }
            this.surface.clearRubbleJob = undefined
            super.onJobComplete(fulfiller)
        } else {
            this.surface.reduceRubble()
            if (!this.surface.hasRubble()) {
                this.surface.clearRubbleJob = undefined
                super.onJobComplete(fulfiller)
            }
        }
    }

    getWorkActivity(): AnimationActivity {
        return RaiderActivity.Clear
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleDig'
    }

    assign(fulfiller: JobFulfiller) {
        const index = this.fulfiller.indexOf(fulfiller)
        if (fulfiller && index === -1) {
            this.fulfiller.push(fulfiller)
        }
    }

    unAssign(fulfiller: JobFulfiller) {
        this.fulfiller.remove(fulfiller)
    }

    hasFulfiller(): boolean {
        return this.fulfiller.length > 0
    }
}
