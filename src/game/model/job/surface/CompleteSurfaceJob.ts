import { Surface } from '../../../terrain/Surface'
import { SurfaceType } from '../../../terrain/SurfaceType'
import { MaterialEntity } from '../../material/MaterialEntity'
import { PathTarget } from '../../PathTarget'
import { RAIDER_TOOL } from '../../raider/RaiderTool'
import { PRIORITY_IDENTIFIER } from '../PriorityIdentifier'
import { Job, JobFulfiller } from '../Job'
import { AnimationActivity, RAIDER_ACTIVITY } from '../../anim/AnimationActivity'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'

export class CompleteSurfaceJob extends Job {
    readonly workplace: PathTarget
    fulfiller: JobFulfiller | undefined

    constructor(readonly surface: Surface, readonly placedItems: MaterialEntity[]) {
        super()
        this.requiredTool = RAIDER_TOOL.shovel
        this.priorityIdentifier = PRIORITY_IDENTIFIER.construction
        this.workplace = PathTarget.fromLocation(surface.getRandomPosition())
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        super.onJobComplete(fulfiller)
        this.placedItems.forEach((placed) => placed.disposeFromWorld())
        this.surface.site = undefined
        this.surface.completeSurfaceJob = undefined
        const targetSurfaceType = this.surface.surfaceType === SurfaceType.POWER_PATH_BUILDING_SITE ? SurfaceType.POWER_PATH : SurfaceType.GROUND
        this.surface.setSurfaceType(targetSurfaceType)
    }

    getWorkplace(entity: JobFulfiller): PathTarget | undefined {
        if (!this.surface.isWalkable() || !this.surface.site?.complete || this.surface.site.canceled) return undefined
        return this.workplace
    }

    getWorkActivity(): AnimationActivity {
        return RAIDER_ACTIVITY.clear
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleBuildPath'
    }

    assign(fulfiller: JobFulfiller) {
        if (this.fulfiller !== fulfiller) this.fulfiller?.stopJob()
        this.fulfiller = fulfiller
    }

    unAssign(fulfiller: JobFulfiller) {
        if (this.fulfiller === fulfiller) this.fulfiller = undefined
    }

    hasFulfiller(): boolean {
        return !!this.fulfiller
    }
}
