import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { Surface } from '../../../terrain/Surface'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { JobFulfiller } from '../Job'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { ShareableJob } from '../ShareableJob'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'
import { Sample } from '../../../../audio/Sample'
import { GameEntity } from '../../../ECS'

export class DrillJob extends ShareableJob {
    digPositionsByFulfiller: Map<GameEntity, PathTarget[]> = new Map()
    progress: number = 0

    constructor(readonly surface: Surface) {
        super()
        this.requiredTool = RaiderTool.DRILL
        this.priorityIdentifier = PriorityIdentifier.DESTRUCTION
        this.workSoundRaider = Sample.SFX_Drill
        this.workSoundVehicle = Sample.SND_BIGDIGDRILL
    }

    getWorkplace(entity: JobFulfiller): PathTarget {
        if (!this.surface.isDigable()) return null
        let digPositions = this.digPositionsByFulfiller.getOrDefault(entity.entity, [])
        const surfaceDigPositions = this.surface.getDigPositions()
        if (digPositions.length < 1 ||
            !digPositions.every((d) => surfaceDigPositions.some((p) => p.equals(d.targetLocation))) ||
            !surfaceDigPositions.every((p) => digPositions.some((d) => p.equals(d.targetLocation)))
        ) {
            const surfaceCenter = this.surface.getCenterWorld2D()
            const fulfillerWorkRange = entity.stats.PickSphere / 2
            digPositions = surfaceDigPositions.map((digPos) => {
                const workPos = digPos.clone().sub(surfaceCenter).setLength(fulfillerWorkRange).add(digPos)
                return PathTarget.fromLocation(workPos)
            })
            this.digPositionsByFulfiller.set(entity.entity, digPositions)
        }
        return entity.findShortestPath(digPositions)?.target
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        if (this.surface.onDrillComplete(this.getWorkplace(fulfiller).targetLocation)) super.onJobComplete(fulfiller)
        else this.progress = 0
    }

    getWorkActivity(): AnimationActivity {
        return RaiderActivity.Drill
    }

    getExpectedTimeLeft(): number {
        const drillPerSecond = this.fulfiller.map((f) => f.getDrillTimeSeconds(this.surface))
            .map((drillTime) => drillTime > 0 ? 1 / drillTime : 0).reduce((l, r) => l + r, 0)
        if (!drillPerSecond) {
            console.warn(`Unexpected drill per second ${drillPerSecond}`)
            return 120000
        }
        return 1000 / drillPerSecond
    }

    addProgress(fulfiller: JobFulfiller, elapsedMs: number) {
        if (this.progress >= 1) return
        const drillTimeSeconds = fulfiller.getDrillTimeSeconds(this.surface)
        if (drillTimeSeconds > 0) {
            this.progress += elapsedMs / (drillTimeSeconds * 1000)
            if (this.progress >= 1) {
                this.onJobComplete(fulfiller)
            }
        }
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleDrill'
    }
}
