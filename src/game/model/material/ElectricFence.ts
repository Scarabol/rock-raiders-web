import { ElectricFenceSceneEntity } from '../../../scene/entities/ElectricFenceSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { CarryFenceJob } from '../job/carry/CarryFenceJob'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { Surface } from '../map/Surface'
import { BuildingCarryPathTarget, CarryPathTarget } from './CarryPathTarget'
import { MaterialEntity } from './MaterialEntity'

export class ElectricFence extends MaterialEntity {

    targetSurface: Surface

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager, surface: Surface) {
        super(sceneMgr, entityMgr, EntityType.ELECTRIC_FENCE)
        this.sceneEntity = new ElectricFenceSceneEntity(sceneMgr)
        this.targetSurface = surface
    }

    protected updateTargets(): CarryPathTarget[] {
        if (this.targets.length < 1) {
            if (this.targetSurface.canPlaceFence()) {
                this.targets = [new CarryPathTarget(this.targetSurface.getCenterWorld2D())]
            } else {
                this.targets = this.entityMgr.getBuildingsByType(EntityType.TOOLSTATION)
                    .map((b) => new BuildingCarryPathTarget(b))
            }
        } else if (!this.targetSurface.canPlaceFence() && !(this.targets[0] as BuildingCarryPathTarget).building) {
            this.targets = this.entityMgr.getBuildingsByType(EntityType.TOOLSTATION)
                .map((b) => new BuildingCarryPathTarget(b))
        }
        return this.targets
    }

    createCarryJob(): CarryFenceJob {
        return new CarryFenceJob(this)
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityConstruction
    }

}
