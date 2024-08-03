import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { Surface } from '../../../terrain/Surface'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { JobFulfiller } from '../Job'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { ShareableJob } from '../ShareableJob'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'
import { SAMPLE } from '../../../../audio/Sample'
import { GameEntity } from '../../../ECS'

export class DrillJob extends ShareableJob {
    digPositionsByFulfiller: Map<GameEntity, PathTarget[]> = new Map()

    constructor(readonly surface: Surface) {
        super()
        this.requiredTool = RaiderTool.DRILL
        this.priorityIdentifier = PriorityIdentifier.DESTRUCTION
        this.workSoundRaider = SAMPLE.SFX_Drill
        this.workSoundVehicle = SAMPLE.SND_BIGDIGDRILL
    }

    getWorkplace(entity: JobFulfiller): PathTarget {
        if (!this.surface.isDigable()) return null
        let digPositions = this.digPositionsByFulfiller.getOrUpdate(entity.entity, () => [])
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

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleDrill'
    }
}
