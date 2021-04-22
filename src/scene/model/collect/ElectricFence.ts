import { CollectableEntity, CollectableType } from './CollectableEntity'
import { PriorityIdentifier } from '../../../game/model/job/PriorityIdentifier'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneManager } from '../../SceneManager'
import { LWOLoader } from '../../../resource/LWOLoader'
import { CollectPathTarget } from '../CollectionTarget'
import { Building } from '../../../game/model/entity/building/Building'
import { Surface } from '../map/Surface'
import { GameState } from '../../../game/model/GameState'

export class ElectricFence extends CollectableEntity {

    targetSurface: Surface

    constructor(surface: Surface) {
        super()
        const resource = ResourceManager.getResource('Buildings/E-Fence/E-Fence4.lwo')
        const mesh = SceneManager.registerMesh(new LWOLoader('Buildings/E-Fence/').parse(resource))
        this.group.add(mesh)
        this.targetSurface = surface
    }

    getCollectableType(): CollectableType {
        return CollectableType.ELECTRIC_FENCE
    }

    getTargetBuildingTypes(): Building[] {
        return [Building.TOOLSTATION]
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityConstruction
    }

    protected updateTargets(): CollectPathTarget[] {
        if (this.targets.length < 1) {
            if (this.targetSurface.canPlaceFence()) {
                this.targets = [new CollectPathTarget(this.targetSurface.getCenterWorld2D(), null, null)]
            } else {
                this.targets = GameState.getBuildingsByType(...this.getTargetBuildingTypes())
                    .map((b) => new CollectPathTarget(b.getDropPosition2D(), null, b))
            }
        } else if (!this.targetSurface.canPlaceFence() && !this.targets[0].building) {
            this.targets = GameState.getBuildingsByType(...this.getTargetBuildingTypes())
                .map((b) => new CollectPathTarget(b.getDropPosition2D(), null, b))
        }
        return this.targets
    }

    get stats() {
        return null
    }

}
