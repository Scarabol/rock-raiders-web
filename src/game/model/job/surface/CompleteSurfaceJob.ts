import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { Surface } from '../../../terrain/Surface'
import { SurfaceType } from '../../../terrain/SurfaceType'
import { MaterialEntity } from '../../material/MaterialEntity'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { ShareableJob } from '../ShareableJob'
import { Raider } from '../../raider/Raider'
import { VehicleEntity } from '../../vehicle/VehicleEntity'

export class CompleteSurfaceJob extends ShareableJob {
    readonly workplace: PathTarget

    constructor(readonly surface: Surface, readonly placedItems: MaterialEntity[]) {
        super()
        this.workplace = PathTarget.fromLocation(surface.getRandomPosition())
    }

    onJobComplete() {
        super.onJobComplete()
        this.placedItems.forEach((placed) => placed.disposeFromWorld())
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

    getWorkplace(entity: Raider | VehicleEntity): PathTarget {
        return this.workplace // TODO return empty array, if surface cannot be repaired
    }

    getWorkActivity(): AnimationActivity {
        return RaiderActivity.Clear
    }
}
