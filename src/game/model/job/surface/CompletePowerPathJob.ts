import { CollectableEntity } from '../../../../scene/model/collect/CollectableEntity'
import { Surface } from '../../../../scene/model/map/Surface'
import { SurfaceType } from '../../../../scene/model/map/SurfaceType'
import { PathTarget } from '../../../../scene/model/PathTarget'
import { RaiderTool } from '../../../../scene/model/RaiderTool'
import { JobType } from '../JobType'
import { PriorityIdentifier } from '../PriorityIdentifier'
import { SurfaceJob } from './SurfaceJob'

export class CompletePowerPathJob extends SurfaceJob {

    placedItems: CollectableEntity[]
    workplaces: PathTarget[]

    constructor(surface: Surface, placedItems: CollectableEntity[]) {
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
