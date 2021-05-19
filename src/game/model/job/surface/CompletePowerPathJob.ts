import { RaiderActivity } from '../../activities/RaiderActivity'
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

    onJobComplete() {
        super.onJobComplete()
        this.placedItems.forEach((placed) => placed.removeFromScene())
        this.surface.setSurfaceType(SurfaceType.POWER_PATH)
    }

    getRequiredTool(): RaiderTool {
        return RaiderTool.SHOVEL
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityConstruction
    }

    getWorkplaces(): PathTarget[] {
        return this.workplaces
    }

    getWorkActivity(): RaiderActivity {
        return RaiderActivity.Clear
    }

}
