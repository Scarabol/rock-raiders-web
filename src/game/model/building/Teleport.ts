import { Vector2 } from 'three'
import { RaidersAmountChangedEvent, UpdateRadarEntityEvent } from '../../../event/LocalEvents'
import { AnimEntityActivity } from '../anim/AnimationActivity'
import { EntityType } from '../EntityType'
import { MoveJob } from '../job/MoveJob'
import { Raider } from '../raider/Raider'
import { SceneSelectionComponent } from '../../component/SceneSelectionComponent'
import { SelectionFrameComponent } from '../../component/SelectionFrameComponent'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { PositionComponent } from '../../component/PositionComponent'
import { MapMarkerChange, MapMarkerComponent, MapMarkerType } from '../../component/MapMarkerComponent'
import { HealthComponent } from '../../component/HealthComponent'
import { OxygenComponent } from '../../component/OxygenComponent'
import { RaiderInfoComponent } from '../../component/RaiderInfoComponent'
import { GameConfig } from '../../../cfg/GameConfig'
import { EventBroker } from '../../../event/EventBroker'

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
        const positionComponent = entity.worldMgr.ecs.addComponent(entity.entity, new PositionComponent(floorPosition, surface))
        entity.sceneEntity.position.copy(floorPosition)
        entity.sceneEntity.position.y += positionComponent.floorOffset
        entity.sceneEntity.rotation.y = heading
        entity.sceneEntity.visible = surface.discovered
        entity.worldMgr.sceneMgr.addMeshGroup(entity.sceneEntity)
        entity.sceneEntity.setAnimation(AnimEntityActivity.TeleportIn, () => {
            entity.sceneEntity.setAnimation(AnimEntityActivity.Stand)
            let healthComponent: HealthComponent
            if (entity.entityType === EntityType.PILOT) {
                healthComponent = entity.worldMgr.ecs.addComponent(entity.entity, new HealthComponent(false, 16, 10, entity.sceneEntity, true, GameConfig.instance.getRockFallDamage(entity.entityType, entity.level)))
                entity.worldMgr.ecs.addComponent(entity.entity, new OxygenComponent(entity.stats.OxygenCoef))
                const infoComp = entity.worldMgr.ecs.addComponent(entity.entity, new RaiderInfoComponent(entity.sceneEntity))
                infoComp.setHungerIndicator((entity as Raider).foodLevel)
            } else {
                healthComponent = entity.worldMgr.ecs.addComponent(entity.entity, new HealthComponent(false, 24, 14, entity.sceneEntity, false, GameConfig.instance.getRockFallDamage(entity.entityType, entity.level)))
            }
            entity.worldMgr.sceneMgr.addSprite(healthComponent.healthBarSprite)
            entity.worldMgr.sceneMgr.addSprite(healthComponent.healthFontSprite)
            const sceneSelectionComponent = entity.worldMgr.ecs.addComponent(entity.entity, new SceneSelectionComponent(entity.sceneEntity, {gameEntity: entity.entity, entityType: entity.entityType}, entity.stats))
            entity.worldMgr.ecs.addComponent(entity.entity, new SelectionFrameComponent(sceneSelectionComponent.pickSphere, entity.stats))
            if (walkOutPos) entity.setJob(new MoveJob(entity, walkOutPos))
            beamListing.remove(entity)
            listing.push(entity)
            EventBroker.publish(new RaidersAmountChangedEvent(entity.worldMgr.entityMgr))
            entity.worldMgr.ecs.addComponent(entity.entity, new MapMarkerComponent(MapMarkerType.DEFAULT))
            EventBroker.publish(new UpdateRadarEntityEvent(MapMarkerType.DEFAULT, entity.entity, MapMarkerChange.UPDATE, floorPosition))
            this.operating = false
        })
        beamListing.push(entity)
    }
}
