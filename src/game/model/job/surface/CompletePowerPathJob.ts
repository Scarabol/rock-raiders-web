import { RaiderActivity } from '../../activities/RaiderActivity'
import { Surface } from '../../map/Surface'
import { SurfaceType } from '../../map/SurfaceType'
import { MaterialEntity } from '../../material/MaterialEntity'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { ShareableJob } from '../ShareableJob'

export class CompletePowerPathJob extends ShareableJob {

    surface: Surface
    placedItems: MaterialEntity[]
    workplaces: PathTarget[]

    constructor(surface: Surface, placedItems: MaterialEntity[]) {
        super()
        this.surface = surface
        this.placedItems = placedItems
        this.workplaces = [new PathTarget(surface.getRandomPosition())]
    }

    onJobComplete() {
        super.onJobComplete()
        this.placedItems.forEach((placed) => placed.sceneEntity.removeFromScene())
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
