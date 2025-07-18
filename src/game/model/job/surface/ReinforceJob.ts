import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { Surface } from '../../../terrain/Surface'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'
import { Job, JobFulfiller } from '../Job'

export class ReinforceJob extends Job {
    readonly fulfiller: JobFulfiller[] = []
    digPositions: PathTarget[] = []

    constructor(readonly surface: Surface) {
        super()
        this.digPositions = this.surface.getDigPositions().map((p) => PathTarget.fromLocation(p))
        this.requiredTool = RaiderTool.HAMMER
        this.priorityIdentifier = PriorityIdentifier.REINFORCE
    }

    getWorkplace(entity: JobFulfiller): PathTarget | undefined {
        if (!this.surface.isReinforcable()) return undefined
        const surfaceDigPositions = this.surface.getDigPositions()
        if (!this.digPositions.every((d) => surfaceDigPositions.some((p) => p.equals(d.targetLocation))) ||
            !surfaceDigPositions.every((p) => this.digPositions.some((d) => p.equals(d.targetLocation)))) {
            this.digPositions = surfaceDigPositions.map((p) => PathTarget.fromLocation(p))
        }
        return entity.findShortestPath(this.digPositions)?.target
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        super.onJobComplete(fulfiller)
        this.surface.reinforce()
    }

    getWorkActivity(): AnimationActivity {
        return RaiderActivity.Reinforce
    }

    getExpectedTimeLeft(): number {
        return 2700
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleReinforce'
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
