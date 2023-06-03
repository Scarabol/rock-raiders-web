import { EventBus } from '../../../event/EventBus'
import { JobCreateEvent } from '../../../event/WorldEvents'
import { ITEM_ACTION_RANGE_SQ } from '../../../params'
import { SceneEntity } from '../../../scene/SceneEntity'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { CarryJob } from '../job/CarryJob'
import { JobState } from '../job/JobState'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { PathTarget } from '../PathTarget'
import { RaiderTraining } from '../raider/RaiderTraining'
import { GameEntity } from '../../ECS'

export abstract class MaterialEntity {
    entity: GameEntity
    carryJob: CarryJob = null
    sceneEntity: SceneEntity = null
    positionAsPathTargets: PathTarget[] = []

    protected constructor(readonly worldMgr: WorldManager, readonly entityType: EntityType, readonly priorityIdentifier: PriorityIdentifier, readonly requiredTraining: RaiderTraining) {
        this.entity = this.worldMgr.ecs.addEntity()
    }

    abstract findCarryTargets(): PathTarget[]

    setupCarryJob(): CarryJob {
        if (!this.carryJob || this.carryJob.jobState === JobState.CANCELED) {
            this.carryJob = new CarryJob(this)
            EventBus.publishEvent(new JobCreateEvent(this.carryJob))
        }
        return this.carryJob
    }

    getPositionAsPathTargets(): PathTarget[] {
        const position = this.sceneEntity.position2D
        if (this.positionAsPathTargets.length < 1 || !this.positionAsPathTargets[0].targetLocation.equals(position)) {
            this.positionAsPathTargets = [PathTarget.fromLocation(position, ITEM_ACTION_RANGE_SQ)] // XXX becomes obsolete when using setter to change position
        }
        return this.positionAsPathTargets
    }

    disposeFromWorld() {
        this.sceneEntity.disposeFromScene()
        this.worldMgr.entityMgr.materials.remove(this)
        this.worldMgr.entityMgr.materialsUndiscovered.remove(this)
    }

    onCarryJobComplete(): void {
    }
}
