import { LWOLoader } from '../../../resource/LWOLoader'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { Surface } from '../map/Surface'
import { CarryPathTarget } from './CarryPathTarget'
import { MaterialEntity } from './MaterialEntity'

export class ElectricFence extends MaterialEntity {

    targetSurface: Surface

    constructor(surface: Surface) {
        super(EntityType.ELECTRIC_FENCE)
        const resource = ResourceManager.getResource('Buildings/E-Fence/E-Fence4.lwo')
        const mesh = SceneManager.registerMesh(new LWOLoader('Buildings/E-Fence/').parse(resource))
        this.group.add(mesh)
        this.targetSurface = surface
        this.priorityIdentifier = PriorityIdentifier.aiPriorityConstruction
    }

    protected updateTargets(): CarryPathTarget[] {
        if (this.targets.length < 1) {
            if (this.targetSurface.canPlaceFence()) {
                this.targets = [new CarryPathTarget(this.targetSurface.getCenterWorld2D(), null, null)]
            } else {
                this.targets = GameState.getBuildingsByType(...this.getTargetBuildingTypes())
                    .map((b) => new CarryPathTarget(b.getDropPosition2D(), null, b))
            }
        } else if (!this.targetSurface.canPlaceFence() && !this.targets[0].building) {
            this.targets = GameState.getBuildingsByType(...this.getTargetBuildingTypes())
                .map((b) => new CarryPathTarget(b.getDropPosition2D(), null, b))
        }
        return this.targets
    }

}
