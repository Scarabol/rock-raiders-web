import { AnimationActivity, RAIDER_ACTIVITY } from '../../anim/AnimationActivity'
import { Surface } from '../../../terrain/Surface'
import { PathTarget } from '../../PathTarget'
import { RAIDER_TOOL } from '../../raider/RaiderTool'
import { Job, JobFulfiller } from '../Job'
import { PRIORITY_IDENTIFIER } from '../PriorityIdentifier'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'
import { GameEntity } from '../../../ECS'

export class DrillJob extends Job {
    readonly fulfiller: JobFulfiller[] = []
    digPositionsByFulfiller: Map<GameEntity, PathTarget[]> = new Map()

    constructor(readonly surface: Surface) {
        super()
        this.requiredTool = RAIDER_TOOL.drill
        this.priorityIdentifier = PRIORITY_IDENTIFIER.destruction
        this.workSoundRaider = 'SFX_Drill'
        this.workSoundVehicle = 'SND_BIGDIGDRILL'
    }

    getWorkplace(entity: JobFulfiller): PathTarget | undefined {
        if (!this.surface.isDigable()) return undefined
        let digPositions = this.digPositionsByFulfiller.getOrUpdate(entity.entity, () => [])
        const surfaceDigPositions = this.surface.getDigPositions()
        if (digPositions.length < 1 ||
            !digPositions.every((d) => surfaceDigPositions.some((p) => p.equals(d.targetLocation))) ||
            !surfaceDigPositions.every((p) => digPositions.some((d) => p.equals(d.targetLocation)))
        ) {
            const surfaceCenter = this.surface.getCenterWorld2D()
            const fulfillerWorkRange = entity.stats.pickSphere / 2
            digPositions = surfaceDigPositions.map((digPos) => {
                const workPos = digPos.clone().sub(surfaceCenter).setLength(fulfillerWorkRange).add(digPos)
                return PathTarget.fromLocation(workPos, undefined, surfaceCenter)
            })
            this.digPositionsByFulfiller.set(entity.entity, digPositions)
        }
        return entity.findShortestPath(digPositions)?.target
    }

    getWorkActivity(): AnimationActivity {
        return RAIDER_ACTIVITY.drill
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
