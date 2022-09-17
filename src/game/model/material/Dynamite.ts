import { DynamiteSceneEntity } from '../../../scene/entities/DynamiteSceneEntity'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { CarryDynamiteJob } from '../job/carry/CarryDynamiteJob'
import { CarryPathTarget } from '../job/carry/CarryPathTarget'
import { JobState } from '../job/JobState'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { Surface } from '../map/Surface'
import { MaterialEntity } from './MaterialEntity'

export class Dynamite extends MaterialEntity {
    constructor(worldMgr: WorldManager, readonly targetSurface: Surface) {
        super(worldMgr, EntityType.DYNAMITE, PriorityIdentifier.DESTRUCTION)
        this.sceneEntity = new DynamiteSceneEntity(this.worldMgr.sceneMgr)
    }

    findCarryTargets(): CarryPathTarget[] {
        if (this.targetSurface?.isDigable()) {
            return this.targetSurface.getDigPositions().map((p) => new CarryPathTarget(p, this.sceneEntity.getRadiusSquare() / 4))
        } else {
            return this.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
        }
    }

    setupCarryJob(): CarryDynamiteJob {
        if (!this.carryJob || this.carryJob.jobState === JobState.CANCELED) {
            this.carryJob = new CarryDynamiteJob(this)
        }
        return this.carryJob as CarryDynamiteJob
    }
}
