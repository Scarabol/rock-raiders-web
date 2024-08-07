import { JobCreateEvent } from '../../../event/WorldEvents'
import { WorldManager } from '../../WorldManager'
import { CarryJob } from '../job/CarryJob'
import { JobState } from '../job/JobState'
import { GameEntity } from '../../ECS'
import { Surface } from '../../terrain/Surface'
import { BuildingSite } from '../building/BuildingSite'
import { MaterialEntityType } from '../EntityType'
import { AnimatedSceneEntity } from '../../../scene/AnimatedSceneEntity'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { RaiderTraining } from '../raider/RaiderTraining'
import { Vector2, Vector3 } from 'three'
import { PositionComponent } from '../../component/PositionComponent'
import { UpdateRadarEntityEvent } from '../../../event/LocalEvents'
import { MapMarkerChange, MapMarkerComponent, MapMarkerType } from '../../component/MapMarkerComponent'
import { EventBroker } from '../../../event/EventBroker'

export class MaterialEntity {
    entity: GameEntity
    carryJob?: CarryJob
    sceneEntity: AnimatedSceneEntity
    priorityIdentifier: PriorityIdentifier = PriorityIdentifier.NONE
    requiredTraining: RaiderTraining = RaiderTraining.NONE

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
        if (this.carryJob?.jobState !== JobState.INCOMPLETE) {
            this.carryJob = new CarryJob(this)
            EventBroker.publish(new JobCreateEvent(this.carryJob))
        }
        return this.carryJob
    }

    disposeFromWorld() {
        if (this.carryJob) this.carryJob.jobState = JobState.CANCELED
        this.worldMgr.ecs.removeComponent(this.entity, MapMarkerComponent)
        EventBroker.publish(new UpdateRadarEntityEvent(MapMarkerType.MATERIAL, this.entity, MapMarkerChange.REMOVE))
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
        const positionComponent = this.worldMgr.ecs.getComponents(this.entity)?.get(PositionComponent)
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
