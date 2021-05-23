import { ResourceManager } from '../../../resource/ResourceManager'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { CarryFenceJob } from '../job/CarryFenceJob'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { Surface } from '../map/Surface'
import { BuildingCarryPathTarget, CarryPathTarget } from './CarryPathTarget'
import { MaterialEntity } from './MaterialEntity'

export class ElectricFence extends MaterialEntity {

    targetSurface: Surface

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager, surface: Surface) {
        super(sceneMgr, entityMgr, EntityType.ELECTRIC_FENCE)
        const mesh = ResourceManager.getLwoModel('Buildings/E-Fence/E-Fence4.lwo')
        this.sceneEntity.add(mesh)
        this.targetSurface = surface
        this.priorityIdentifier = PriorityIdentifier.aiPriorityConstruction
    }

    protected updateTargets(): CarryPathTarget[] {
        if (this.targets.length < 1) {
            if (this.targetSurface.canPlaceFence()) {
                this.targets = [new CarryPathTarget(this.targetSurface.getCenterWorld2D())]
            } else {
                this.targets = this.entityMgr.getBuildingsByType(...this.getTargetBuildingTypes())
                    .map((b) => new BuildingCarryPathTarget(b))
            }
        } else if (!this.targetSurface.canPlaceFence() && !(this.targets[0] as BuildingCarryPathTarget).building) {
            this.targets = this.entityMgr.getBuildingsByType(...this.getTargetBuildingTypes())
                .map((b) => new BuildingCarryPathTarget(b))
        }
        return this.targets
    }

    createCarryJob(): CarryFenceJob {
        return new CarryFenceJob(this)
    }

}
