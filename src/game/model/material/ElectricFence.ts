import { ElectricFenceSceneEntity } from '../../../scene/entities/ElectricFenceSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { CarryFenceJob } from '../job/carry/CarryFenceJob'
import { CarryPathTarget } from '../job/carry/CarryPathTarget'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { Surface } from '../map/Surface'
import { MaterialEntity } from './MaterialEntity'

export class ElectricFence extends MaterialEntity {

    targetSurface: Surface
    target: CarryPathTarget[]

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager, targetSurface: Surface) {
        super(sceneMgr, entityMgr, EntityType.ELECTRIC_FENCE)
        this.sceneEntity = new ElectricFenceSceneEntity(sceneMgr)
        this.targetSurface = targetSurface
        this.target = [new CarryPathTarget(targetSurface.getCenterWorld2D())]
    }

    findCarryTargets(): CarryPathTarget[] {
        if (this.target.every((t) => t.isInvalid())) {
            return this.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
        } else {
            return this.target
        }
    }

    createCarryJob(): CarryFenceJob {
        return new CarryFenceJob(this)
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.CONSTRUCTION
    }

}
