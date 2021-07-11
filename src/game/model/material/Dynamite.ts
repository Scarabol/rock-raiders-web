import { DynamiteSceneEntity } from '../../../scene/entities/DynamiteSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { CarryDynamiteJob } from '../job/carry/CarryDynamiteJob'
import { CarryJob } from '../job/carry/CarryJob'
import { CarryPathTarget } from '../job/carry/CarryPathTarget'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { Surface } from '../map/Surface'
import { MaterialEntity } from './MaterialEntity'

export class Dynamite extends MaterialEntity {

    targetSurface: Surface

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager, surface: Surface) {
        super(sceneMgr, entityMgr, EntityType.DYNAMITE)
        this.sceneEntity = new DynamiteSceneEntity(sceneMgr)
        this.targetSurface = surface
    }

    findCarryTargets(): CarryPathTarget[] {
        if (this.targetSurface?.isDigable()) {
            return this.targetSurface.getDigPositions().map((p) => new CarryPathTarget(p))
        } else {
            return this.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
        }
    }

    createCarryJob(): CarryJob<Dynamite> {
        return new CarryDynamiteJob(this)
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityDestruction
    }

}
