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
        return this.workplace // TODO return empty array, if surface cannot be repaired
    }
}
