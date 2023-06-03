import { EventBus } from '../../../event/EventBus'
import { JobCreateEvent } from '../../../event/WorldEvents'
import { SceneEntity } from '../../../scene/SceneEntity'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { CarryJob } from '../job/CarryJob'
import { JobState } from '../job/JobState'
import { GameEntity } from '../../ECS'
import { BarrierActivity } from '../anim/AnimationActivity'
import { Surface } from '../../terrain/Surface'
import { BuildingSite } from '../building/BuildingSite'
import { BarrierLocation } from './BarrierLocation'
import { MaterialEntityType } from '../../entity/MaterialSpawner'

export class MaterialEntity {
    entity: GameEntity
    carryJob: CarryJob = null
    sceneEntity: SceneEntity = null

    constructor(
        readonly worldMgr: WorldManager,
        readonly entityType: MaterialEntityType,
        readonly targetSurface: Surface,
        readonly targetSite: BuildingSite,
        readonly location: BarrierLocation,
    ) {
        this.entity = this.worldMgr.ecs.addEntity()
    }

    setupCarryJob(): CarryJob {
        if (!this.carryJob || this.carryJob.jobState === JobState.CANCELED) {
            this.carryJob = new CarryJob(this)
            EventBus.publishEvent(new JobCreateEvent(this.carryJob))
        }
        return this.carryJob
    }

    disposeFromWorld() {
        if (this.entityType === EntityType.BARRIER) {
            this.sceneEntity.changeActivity(BarrierActivity.Teleport, () => this.dispose())
        } else {
            this.dispose()
        }
    }

    private dispose() {
        this.sceneEntity.disposeFromScene()
        this.worldMgr.entityMgr.materials.remove(this)
        this.worldMgr.entityMgr.materialsUndiscovered.remove(this)
        this.worldMgr.entityMgr.placedFences.remove(this)
        this.worldMgr.entityMgr.removeEntity(this.entity, this.entityType)
    }
}
