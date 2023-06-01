import { Vector2 } from 'three'
import { Sample } from '../../../audio/Sample'
import { EventBus } from '../../../event/EventBus'
import { RaidersAmountChangedEvent } from '../../../event/LocalEvents'
import { RaiderActivity } from '../anim/AnimationActivity'
import { EntityType } from '../EntityType'
import { MoveJob } from '../job/raider/MoveJob'
import { Raider } from '../raider/Raider'
import { VehicleEntity } from '../vehicle/VehicleEntity'

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
        entity.sceneEntity.addToScene(worldPosition, heading)
        entity.sceneEntity.playPositionalAudio(Sample[Sample.SND_teleport], false)
        entity.sceneEntity.changeActivity(RaiderActivity.TeleportIn, () => {
            entity.sceneEntity.changeActivity()
            entity.sceneEntity.makeSelectable(entity)
            if (walkOutPos) entity.setJob(new MoveJob(walkOutPos))
            beamListing.remove(entity)
            listing.push(entity)
            EventBus.publishEvent(new RaidersAmountChangedEvent(entity.worldMgr.entityMgr))
            this.operating = false
        })
        beamListing.push(entity)
    }
}
