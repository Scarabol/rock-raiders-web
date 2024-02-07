import { JobCreateEvent } from '../../../event/WorldEvents'
import { WorldManager } from '../../WorldManager'
import { CarryJob } from '../job/CarryJob'
import { JobState } from '../job/JobState'
import { GameEntity } from '../../ECS'
import { Surface } from '../../terrain/Surface'
import { BuildingSite } from '../building/BuildingSite'
import { EntityType, MaterialEntityType } from '../EntityType'
import { AnimatedSceneEntity } from '../../../scene/AnimatedSceneEntity'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { RaiderTraining } from '../raider/RaiderTraining'
import { Vector2, Vector3 } from 'three'
import { PositionComponent } from '../../component/PositionComponent'
import { UpdateRadarEntityEvent } from '../../../event/LocalEvents'
import { MapMarkerChange, MapMarkerComponent, MapMarkerType } from '../../component/MapMarkerComponent'
import { EventBroker } from '../../../event/EventBroker'
import { TooltipComponent } from '../../component/TooltipComponent'
import { GameConfig } from '../../../cfg/GameConfig'
import { TooltipSpriteBuilder } from '../../../resource/TooltipSpriteBuilder'

export class MaterialEntity {
    entity: GameEntity
    carryJob: CarryJob = null
    sceneEntity: AnimatedSceneEntity = null
    priorityIdentifier: PriorityIdentifier = PriorityIdentifier.NONE
    requiredTraining: RaiderTraining = RaiderTraining.NONE

    constructor(
        readonly worldMgr: WorldManager,
        readonly entityType: MaterialEntityType,
        readonly targetSurface: Surface,
        readonly targetSite: BuildingSite,
        readonly location: Vector2,
    ) {
        this.entity = this.worldMgr.ecs.addEntity()
        const objectKey = this.entityType.toLowerCase()
        const objectName = GameConfig.instance.objectNamesCfg.get(objectKey)
        const sfxKey = GameConfig.instance.objTtSFXs.get(objectKey)
        if (objectName) this.worldMgr.ecs.addComponent(this.entity, new TooltipComponent(this.entity, objectName, sfxKey, () => {
            return TooltipSpriteBuilder.getTooltipSprite(objectName, entityType === EntityType.ELECTRIC_FENCE ? 100 : 0)
        }))
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
        this.worldMgr.sceneMgr.removeMeshGroup(this.sceneEntity)
        this.sceneEntity.dispose()
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
