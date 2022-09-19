import { RaiderActivity } from '../../activities/RaiderActivity'
import { Surface } from '../../map/Surface'
import { SurfaceType } from '../../map/SurfaceType'
import { MaterialEntity } from '../../material/MaterialEntity'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { ShareableJob } from '../ShareableJob'

export class CompleteSurfaceJob extends ShareableJob {
    readonly workplaces: PathTarget[]

    constructor(readonly surface: Surface, readonly placedItems: MaterialEntity[]) {
        super()
        this.workplaces = [PathTarget.fromLocation(surface.getRandomPosition())]
    }

    onJobComplete() {
        super.onJobComplete()
        this.placedItems.forEach((placed) => placed.sceneEntity.disposeFromScene())
        const targetSurfaceType = this.surface.surfaceType === SurfaceType.POWER_PATH_BUILDING_SITE ? SurfaceType.POWER_PATH : SurfaceType.GROUND
        this.surface.setSurfaceType(targetSurfaceType)
        this.surface.site = null
    }

    getRequiredTool(): RaiderTool {
        return RaiderTool.SHOVEL
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.CONSTRUCTION
    }

    getWorkplaces(): PathTarget[] {
        return this.workplaces // TODO return empty array, if surface cannot be repaired
    }

    getWorkActivity(): RaiderActivity {
        return RaiderActivity.Clear
    }
}
