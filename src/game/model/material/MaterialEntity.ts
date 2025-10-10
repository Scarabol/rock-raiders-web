import { JobCreateEvent } from '../../../event/WorldEvents'
import { WorldManager } from '../../WorldManager'
import { CarryJob } from '../job/CarryJob'
import { JOB_STATE } from '../job/JobState'
import { GameEntity } from '../../ECS'
import { Surface } from '../../terrain/Surface'
import { BuildingSite } from '../building/BuildingSite'
import { MaterialEntityType } from '../EntityType'
import { AnimatedSceneEntity } from '../../../scene/AnimatedSceneEntity'
import { PRIORITY_IDENTIFIER, PriorityIdentifier } from '../job/PriorityIdentifier'
import { RAIDER_TRAINING, RaiderTraining } from '../raider/RaiderTraining'
import { Vector2, Vector3 } from 'three'
import { PositionComponent } from '../../component/PositionComponent'
import { UpdateRadarEntityEvent } from '../../../event/LocalEvents'
import { MAP_MARKER_CHANGE, MAP_MARKER_TYPE, MapMarkerComponent } from '../../component/MapMarkerComponent'
import { EventBroker } from '../../../event/EventBroker'

export class MaterialEntity {
    entity: GameEntity
    carryJob?: CarryJob
    sceneEntity: AnimatedSceneEntity
    priorityIdentifier: PriorityIdentifier = PRIORITY_IDENTIFIER.none
    requiredTraining: RaiderTraining = RAIDER_TRAINING.none

    constructor(
        readonly worldMgr: WorldManager,
        readonly entityType: MaterialEntityType,
        readonly targetSurface: Surface | undefined,
        readonly targetSite: BuildingSite | undefined,
        readonly location: Vector2 | undefined,
    ) {
        this.entity = this.worldMgr.ecs.addEntity()
        this.sceneEntity = new AnimatedSceneEntity()
    }

    setupCarryJob(): CarryJob {
        if (this.carryJob?.jobState !== JOB_STATE.incomplete) {
            this.carryJob = new CarryJob(this)
            EventBroker.publish(new JobCreateEvent(this.carryJob))
        }
        return this.carryJob
    }

    disposeFromWorld() {
        if (this.carryJob) this.carryJob.jobState = JOB_STATE.canceled
        this.worldMgr.ecs.removeComponent(this.entity, MapMarkerComponent)
        EventBroker.publish(new UpdateRadarEntityEvent(MAP_MARKER_TYPE.material, this.entity, MAP_MARKER_CHANGE.remove))
        this.worldMgr.sceneMgr.disposeSceneEntity(this.sceneEntity)
        this.worldMgr.entityMgr.removeEntity(this.entity)
        this.worldMgr.ecs.removeEntity(this.entity)
    }

    getPosition(): Vector3 {
        return this.sceneEntity.position.clone()
    }

    getPosition2D(): Vector2 {
        return this.sceneEntity.position2D
    }

    setPosition(position: Vector3) {
        this.sceneEntity.position.copy(position)
        const surface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(position)
        this.sceneEntity.visible = surface.discovered
        const positionComponent = this.worldMgr.ecs.getComponents(this.entity).get(PositionComponent)
        if (positionComponent) {
            positionComponent.position.copy(position)
            positionComponent.surface = surface
            positionComponent.markDirty()
            this.sceneEntity.position.y += positionComponent.floorOffset
        }
    }

    getSurface(): Surface {
        return this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(this.getPosition())
    }
}
