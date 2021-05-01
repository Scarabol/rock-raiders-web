import { MaterialEntity } from '../../collect/MaterialEntity'
import { Surface } from '../../map/Surface'
import { SurfaceType } from '../../map/SurfaceType'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { JobType } from '../JobType'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { SurfaceJob } from './SurfaceJob'

export class CompletePowerPathJob extends SurfaceJob {

    placedItems: MaterialEntity[]
    workplaces: PathTarget[]

    constructor(surface: Surface, placedItems: MaterialEntity[]) {
        super(JobType.COMPLETE_POWER_PATH, surface)
        this.requiredTool = RaiderTool.SHOVEL
        this.surface = surface
        this.placedItems = placedItems
        this.workplaces = [new PathTarget(surface.getRandomPosition())]
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
