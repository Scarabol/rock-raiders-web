import { MaterialEntity } from '../../collect/MaterialEntity'
import { Surface } from '../../map/Surface'
import { SurfaceType } from '../../map/SurfaceType'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { PublicJob } from '../Job'
import { JobType } from '../JobType'
import { PriorityIdentifier } from '../PriorityIdentifier'

export class CompletePowerPathJob extends PublicJob {

    surface: Surface
    placedItems: MaterialEntity[]
    workplaces: PathTarget[]

    constructor(surface: Surface, placedItems: MaterialEntity[]) {
        super(JobType.COMPLETE_POWER_PATH)
        this.surface = surface
        this.placedItems = placedItems
        this.workplaces = [new PathTarget(surface.getRandomPosition())]
    }

    getRequiredTool(): RaiderTool {
        return RaiderTool.SHOVEL
    }

    onJobComplete() {
        super.onJobComplete()
        this.placedItems.forEach((placed) => placed.removeFromScene())
        this.surface.surfaceType = SurfaceType.POWER_PATH
        this.surface.updateTexture()
        this.surface.neighbors.forEach((s) => s.updateTexture())
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityConstruction
    }

    getWorkplaces(): PathTarget[] {
        return this.workplaces
    }

}
