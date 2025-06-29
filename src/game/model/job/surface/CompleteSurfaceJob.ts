import { Surface } from '../../../terrain/Surface'
import { SurfaceType } from '../../../terrain/SurfaceType'
import { MaterialEntity } from '../../material/MaterialEntity'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { Job, JobFulfiller } from '../Job'
import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'

export class CompleteSurfaceJob extends Job {
    readonly fulfiller: JobFulfiller[] = []
    readonly workplace: PathTarget

    constructor(readonly surface: Surface, readonly placedItems: MaterialEntity[]) {
        super()
        this.requiredTool = RaiderTool.SHOVEL
        this.priorityIdentifier = PriorityIdentifier.CONSTRUCTION
        this.workplace = PathTarget.fromLocation(surface.getRandomPosition())
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        super.onJobComplete(fulfiller)
        this.placedItems.forEach((placed) => placed.disposeFromWorld())
        const targetSurfaceType = this.surface.surfaceType === SurfaceType.POWER_PATH_BUILDING_SITE ? SurfaceType.POWER_PATH : SurfaceType.GROUND
        this.surface.setSurfaceType(targetSurfaceType)
        this.surface.site = undefined
    }

    getWorkplace(entity: JobFulfiller): PathTarget | undefined {
        if (!this.surface.isWalkable()) return undefined
        return this.workplace
    }

    getWorkActivity(): AnimationActivity {
        return RaiderActivity.Clear
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleBuildPath'
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
