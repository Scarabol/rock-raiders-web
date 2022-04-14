import { RaiderActivity } from '../../activities/RaiderActivity'
import { Surface } from '../../map/Surface'
import { MaterialEntity } from '../../material/MaterialEntity'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { ShareableJob } from '../ShareableJob'
import { SurfaceType } from '../../map/SurfaceType'

export class CompleteSurfaceJob extends ShareableJob {
    workplaces: PathTarget[]

    constructor(surface: Surface, readonly placedItems: MaterialEntity[]) {
        super()
        this.surface = surface
        this.workplaces = [new PathTarget(surface.getRandomPosition())]
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
        return this.workplaces
    }

    getWorkActivity(): RaiderActivity {
        return RaiderActivity.Clear
    }
}
