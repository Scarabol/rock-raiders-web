import { Vector2 } from 'three'
import { Sample } from '../../../audio/Sample'
import { EventBus } from '../../../event/EventBus'
import { RaidersAmountChangedEvent } from '../../../event/LocalEvents'
import { AnimEntityActivity, RaiderActivity } from '../anim/AnimationActivity'
import { EntityType } from '../EntityType'
import { MoveJob } from '../job/MoveJob'
import { Raider } from '../raider/Raider'
import { SceneSelectionComponent } from '../../component/SceneSelectionComponent'
import { SelectionFrameComponent } from '../../component/SelectionFrameComponent'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { PositionComponent } from '../../component/PositionComponent'

type TeleportEntity = Raider | VehicleEntity

export class Teleport {
    teleportedEntityTypes: EntityType[] = []
    powered: boolean = false
    operating: boolean = false

    constructor(teleportedEntityTypes: EntityType[]) {
        this.teleportedEntityTypes = teleportedEntityTypes
    }

    canTeleportIn(entityType: EntityType): boolean {
        return this.powered && !this.operating && this.teleportedEntityTypes.includes(entityType)
    }

    teleportIn(entity: TeleportEntity, listing: TeleportEntity[], beamListing: TeleportEntity[], worldPosition: Vector2, heading: number, walkOutPos: Vector2) {
        this.operating = true
        const floorPosition = entity.worldMgr.sceneMgr.getFloorPosition(worldPosition)
        const surface = entity.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(floorPosition)
        entity.sceneEntity.position.copy(floorPosition)
        entity.worldMgr.ecs.addComponent(entity.entity, new PositionComponent(floorPosition, surface))
        entity.sceneEntity.rotation.y = heading
        entity.sceneEntity.visible = surface.discovered
        entity.worldMgr.sceneMgr.addMeshGroup(entity.sceneEntity)
        entity.worldMgr.sceneMgr.addPositionalAudio(entity.sceneEntity, Sample[Sample.SND_teleport], true, false)
        entity.sceneEntity.setAnimation(RaiderActivity.TeleportIn, () => {
            entity.sceneEntity.setAnimation(AnimEntityActivity.Stand)
            const sceneSelectionComponent = entity.worldMgr.ecs.addComponent(entity.entity, new SceneSelectionComponent(entity.sceneEntity, {gameEntity: entity.entity, entityType: entity.entityType}, entity.stats))
            entity.worldMgr.ecs.addComponent(entity.entity, new SelectionFrameComponent(sceneSelectionComponent.pickSphere, entity.stats))
            if (walkOutPos) entity.setJob(new MoveJob(walkOutPos))
            beamListing.remove(entity)
            listing.push(entity)
            EventBus.publishEvent(new RaidersAmountChangedEvent(entity.worldMgr.entityMgr))
            this.operating = false
        })
        beamListing.push(entity)
    }
}
