import { Surface } from '../../../terrain/Surface'
import { SurfaceType } from '../../../terrain/SurfaceType'
import { MaterialEntity } from '../../material/MaterialEntity'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { ShareableJob } from '../ShareableJob'
import { Raider } from '../../raider/Raider'
import { VehicleEntity } from '../../vehicle/VehicleEntity'
import { JobFulfiller } from '../Job'
import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'

export class CompleteSurfaceJob extends ShareableJob {
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
        this.surface.site = null
    }

    getWorkplace(entity: Raider | VehicleEntity): PathTarget {
        if (!this.surface.isWalkable()) return null
        return this.workplace
    }

    getWorkActivity(): AnimationActivity {
        return RaiderActivity.Clear
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleBuildPath'
    }
}
