import { Vector2 } from 'three'
import { Sample } from '../../../audio/Sample'
import { EventBus } from '../../../event/EventBus'
import { RaidersAmountChangedEvent } from '../../../event/LocalEvents'
import { RaiderActivity } from '../activities/RaiderActivity'
import { EntityType } from '../EntityType'
import { FulfillerEntity } from '../FulfillerEntity'
import { MoveJob } from '../job/raider/MoveJob'

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

    teleportIn<T extends FulfillerEntity>(entity: T, listing: T[], beamListing: T[], worldPosition: Vector2, heading: number, walkOutPos: Vector2) {
        this.operating = true
        entity.sceneEntity.addToScene(worldPosition, heading)
        entity.sceneEntity.playPositionalAudio(Sample[Sample.SND_teleport], false)
        entity.sceneEntity.changeActivity(RaiderActivity.TeleportIn, () => {
            this.operating = false
            entity.sceneEntity.changeActivity()
            entity.sceneEntity.makeSelectable(entity)
            if (walkOutPos) entity.setJob(new MoveJob(walkOutPos))
            beamListing.remove(entity)
            listing.push(entity)
            EventBus.publishEvent(new RaidersAmountChangedEvent(entity.entityMgr))
        })
        beamListing.push(entity)
    }
}
